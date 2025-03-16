from fastapi import FastAPI, File, UploadFile
import pandas as pd
import numpy as np
import io
import re
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_transaction_amount(value):
    value = str(value).replace(",", "")
    match = re.search(r"([\d.]+)", value)
    return float(match.group(1)) if match else 0.0

def get_loyalty_offer(rfm_score):
    offers = {
        "VIP": {"description": "Вы наш лучший клиент! 🎉 Получите -20% на следующий заказ!", "link": "https://shop.com/vip-offer"},
        "Loyal": {"description": "Купите 2 товара — получите 3-й бесплатно! 🎁", "link": "https://shop.com/loyalty"},
        "Inactive": {"description": "Дарим 500 бонусов за возвращение! 💰", "link": "https://shop.com/welcome-back"},
        "Regular": {"description": "Персональная скидка -15% на ваш следующий заказ! 🔥", "link": "https://shop.com/special-deal"},
    }
    if rfm_score in ["444", "344", "434"]:
        return offers["VIP"]
    elif rfm_score in ["144", "244"]:
        return offers["Loyal"]
    elif rfm_score in ["411", "311"]:
        return offers["Regular"]
    else:
        return offers["Inactive"]

@app.post("/upload/")
async def upload_csv(
    transactions_file: UploadFile = File(...), 
    customers_file: UploadFile = File(...)
):
    try:
        transactions_contents = await transactions_file.read()
        customers_contents = await customers_file.read()
        
        # Проверьте, какой файл содержит какие данные
        df_transactions = pd.read_csv(io.BytesIO(transactions_contents), encoding="utf-8")
        df_customers = pd.read_csv(io.BytesIO(customers_contents), encoding="utf-8")
        
        print("Transactions DataFrame columns:", df_transactions.columns.tolist())
        print("Customers DataFrame columns:", df_customers.columns.tolist())
        
        # Если файлы перепутаны, можно поменять их местами:
        if "PurchaseDate" not in df_transactions.columns and "PurchaseDate" in df_customers.columns:
            df_transactions, df_customers = df_customers, df_transactions

        # Очистка имён столбцов
        df_transactions.columns = df_transactions.columns.str.strip().str.replace(" ", "")
        df_customers.columns = df_customers.columns.str.strip().str.replace(" ", "")
        
        # Далее, удаляем строки с NaN в столбце PurchaseDate
        df_transactions = df_transactions.dropna(subset=["PurchaseDate"])
        
        df_transactions["PurchaseDate"] = pd.to_datetime(
            df_transactions["PurchaseDate"],
            format="%Y/%m/%d %I:%M %p (MSK)",
            errors="coerce"
        )
        df_customers["created_at"] = pd.to_datetime(
            df_customers["created_at"],
            format="%Y/%m/%d %I:%M %p (MSK)",
            errors="coerce"
        )
        df_transactions["TransactionAmount"] = df_transactions["TransactionAmount"].apply(clean_transaction_amount)
        current_date = df_transactions["PurchaseDate"].max() + pd.Timedelta(days=1)
        

        rfm = df_transactions.groupby("CustomerID").agg(
            Recency=("PurchaseDate", lambda x: (current_date - x.max()).days),
            Frequency=("TransactionID", "count"),
            Monetary=("TransactionAmount", "sum")
        ).reset_index()

        def assign_scores(column):
            try:
                return pd.qcut(column, q=4, labels=[1, 2, 3, 4]).astype(int)
            except ValueError:
                return pd.qcut(column.rank(method="first"), q=4, labels=[1, 2, 3, 4]).astype(int)

        rfm["R_Score"] = assign_scores(rfm["Recency"])
        rfm["F_Score"] = assign_scores(rfm["Frequency"])
        rfm["M_Score"] = assign_scores(rfm["Monetary"])
        rfm["RFM_Score"] = rfm["R_Score"].astype(str) + rfm["F_Score"].astype(str) + rfm["M_Score"].astype(str)

        result = rfm.merge(df_customers, on="CustomerID", how="left")
        result["LoyaltyOffer"] = result["RFM_Score"].apply(get_loyalty_offer)

        summary = {
            "total_customers": len(result),
            "avg_recency": result["Recency"].mean(),
            "avg_frequency": result["Frequency"].mean(),
            "avg_monetary": result["Monetary"].mean()
        }

        return {
            "filename_transactions": transactions_file.filename,
            "filename_customers": customers_file.filename,
            "summary": summary,
            "rfm_analysis": result.to_dict(orient="records")
        }

    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Загрузите файлы transactions.csv и customers.csv для RFM-анализа."}

"""Canonical CSV/data access — single place for all pd.read_csv calls."""

import pandas as pd


def _coerce(val) -> object:
    """Convert numpy/pandas scalars to JSON-safe native Python types."""
    try:
        if pd.isna(val):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(val, "item"):  # numpy scalar → native Python
        return val.item()
    return val


def read_csv_dataframe(file_path: str) -> pd.DataFrame:
    """Read a CSV file and return a pandas DataFrame."""
    return pd.read_csv(file_path)


def read_csv_records(file_path: str) -> list[dict]:
    """Read a CSV file and return coerced JSON-safe records."""
    df = read_csv_dataframe(file_path)
    return [
        {k: _coerce(v) for k, v in row.items()} for row in df.to_dict(orient="records")
    ]


def get_data_source_preview(file_path: str) -> dict:
    """Return preview rows and descriptive statistics for a CSV file."""
    try:
        df = read_csv_dataframe(file_path)
        preview_rows = [
            {k: _coerce(v) for k, v in row.items()}
            for row in df.head(10).to_dict(orient="records")
        ]

        desc = df.describe(include="all").T
        describe_columns = list[str](desc.columns)
        describe_rows = []
        for stat_name, row in desc.iterrows():
            row_dict: dict[str, object] = {"_stat": str(stat_name)}
            for col in describe_columns:
                row_dict[col] = _coerce(row[col])
            describe_rows.append(row_dict)

        return {
            "preview_rows": preview_rows,
            "describe_columns": describe_columns,
            "describe_rows": describe_rows,
        }
    except Exception:
        return {"preview_rows": [], "describe_columns": [], "describe_rows": []}

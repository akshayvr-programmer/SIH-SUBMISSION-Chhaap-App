CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE comparables (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    craft       TEXT,
    price_inr   INTEGER NOT NULL,
    source      TEXT,
    embedding   VECTOR(768)
);

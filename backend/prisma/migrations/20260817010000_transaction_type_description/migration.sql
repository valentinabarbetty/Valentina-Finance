-- The transaction-type CRUD exposes an optional description, matching the
-- existing category experience. This addition is nullable and non-destructive.
ALTER TABLE "transaction_types" ADD COLUMN "description" TEXT;

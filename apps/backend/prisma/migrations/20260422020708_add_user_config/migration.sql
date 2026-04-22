-- CreateTable
CREATE TABLE "user_config" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "calorie_target" INTEGER NOT NULL,
    "protein_target" INTEGER NOT NULL,
    "steps_target" INTEGER NOT NULL,
    "calorie_floor" INTEGER NOT NULL,
    "protein_floor" INTEGER NOT NULL,
    "steps_floor" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_config_user_id_key" ON "user_config"("user_id");

-- AddForeignKey
ALTER TABLE "user_config" ADD CONSTRAINT "user_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

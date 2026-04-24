/*
  Warnings:

  - Added the required column `activity_level` to the `user_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `age` to the `user_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calorie_ceiling` to the `user_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goal_type` to the `user_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height_cm` to the `user_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `user_config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight_kg` to the `user_config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_config" ADD COLUMN     "activity_level" TEXT NOT NULL,
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "calorie_ceiling" INTEGER NOT NULL,
ADD COLUMN     "goal_type" TEXT NOT NULL,
ADD COLUMN     "height_cm" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "measurement_system" TEXT NOT NULL DEFAULT 'metric',
ADD COLUMN     "sex" TEXT NOT NULL,
ADD COLUMN     "weight_kg" DOUBLE PRECISION NOT NULL;

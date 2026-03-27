-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('multiple_choice', 'free_text', 'code_writing', 'bug_fix', 'code_order', 'code_gaps');

-- CreateEnum
CREATE TYPE "AssignmentDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "XpEventSource" AS ENUM ('topic', 'quiz', 'teacher_assignment', 'programming_game');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'assignment_completed';
ALTER TYPE "ActivityType" ADD VALUE 'programming_level_completed';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'teacher';

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_groups" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_memberships" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "moduleId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignmentType" "AssignmentType" NOT NULL,
    "difficulty" "AssignmentDifficulty" NOT NULL DEFAULT 'easy',
    "subjectLabel" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'draft',
    "xpReward" INTEGER NOT NULL DEFAULT 40,
    "content" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignment_groups" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "teacher_assignment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignment_attempts" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_assignment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "source" "XpEventSource" NOT NULL,
    "sourceId" TEXT,
    "amount" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programming_game_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "levelKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastDurationSec" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programming_game_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_groups_teacherId_slug_key" ON "teacher_groups"("teacherId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "group_memberships_groupId_studentId_key" ON "group_memberships"("groupId", "studentId");

-- CreateIndex
CREATE INDEX "teacher_assignments_teacherId_status_idx" ON "teacher_assignments"("teacherId", "status");

-- CreateIndex
CREATE INDEX "teacher_assignments_moduleId_topicId_idx" ON "teacher_assignments"("moduleId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignment_groups_assignmentId_groupId_key" ON "teacher_assignment_groups"("assignmentId", "groupId");

-- CreateIndex
CREATE INDEX "teacher_assignment_attempts_assignmentId_studentId_idx" ON "teacher_assignment_attempts"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "xp_events_studentId_createdAt_idx" ON "xp_events"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "programming_game_progress_studentId_levelKey_key" ON "programming_game_progress"("studentId", "levelKey");

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_groups" ADD CONSTRAINT "teacher_groups_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teacher_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment_groups" ADD CONSTRAINT "teacher_assignment_groups_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "teacher_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment_groups" ADD CONSTRAINT "teacher_assignment_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teacher_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment_attempts" ADD CONSTRAINT "teacher_assignment_attempts_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "teacher_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment_attempts" ADD CONSTRAINT "teacher_assignment_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programming_game_progress" ADD CONSTRAINT "programming_game_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { TopicLearningExperience } from "@/components/topic/topic-learning-experience";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopicDetails } from "@/lib/data";
import { requireRole } from "@/lib/permissions";
import { canAccessTopic } from "@/lib/progress";

export default async function TopicPage({
  params
}: {
  params: { moduleSlug: string; topicSlug: string };
}) {
  const session = await requireRole("student");
  let topicData: Awaited<ReturnType<typeof getTopicDetails>>;

  try {
    topicData = await getTopicDetails(session.user.id, params.moduleSlug, params.topicSlug);
  } catch {
    notFound();
  }

  const { student, topic } = topicData;
  const allowed = await canAccessTopic(student.id, topic.id);

  if (!allowed) {
    redirect(`/modules/${params.moduleSlug}`);
  }

  const lecture = topic.lectureContent as { blocks: { title: string; body: string }[] };
  const completed = topic.progress.some((entry) => entry.completed);

  return (
    <AppShell role="student">
      <TopicLearningExperience
        moduleTitle={topic.module.title}
        moduleSlug={params.moduleSlug}
        topicId={topic.id}
        topicTitle={topic.title}
        topicDescription={topic.description}
        practiceType={topic.practiceType}
        xpReward={topic.xpReward}
        lectureBlocks={lecture.blocks}
        homeworkDescription={topic.homework?.description || topic.homeworkText}
        completed={completed}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Навигация</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={`/modules/${params.moduleSlug}`} className="inline-flex text-sm font-semibold text-pop-coral">
            Вернуться к модулю
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}

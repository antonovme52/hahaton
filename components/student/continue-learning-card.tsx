import { ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ContinueLearningCard({
  moduleSlug,
  topicSlug,
  title,
  moduleTitle
}: {
  moduleSlug: string;
  topicSlug: string;
  title: string;
  moduleTitle: string;
}) {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-pop-ink via-slate-800 to-pop-plum text-white">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Rocket className="h-6 w-6" />
          </div>
          <p className="text-base text-white/70">Продолжить обучение</p>
          <h2 className="mt-2 text-3xl font-bold leading-snug">{title}</h2>
          <p className="mt-2 text-base text-white/70">{moduleTitle}</p>
        </div>
        <Button asChild variant="secondary" className="self-start md:self-center">
          <Link href={`/modules/${moduleSlug}/topics/${topicSlug}`} className="gap-2">
            Открыть урок
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

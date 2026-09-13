import { Link } from "react-router-dom";
import { BookOpen, BookText, ClipboardCheck, Languages, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ContentLevel, ContentType } from "@/types";

type ContentCardProps = {
  title: string;
  description: string;
  level: ContentLevel;
  type: ContentType;
  to: string;
  tags?: string[];
};

const iconMap = {
  grammar: BookOpen,
  story: BookText,
  vocab: Languages,
  pronunciation: Mic,
  quiz: ClipboardCheck,
} as const;

export default function ContentCard({
  title,
  description,
  level,
  type,
  to,
  tags = [],
}: ContentCardProps) {
  const Icon = iconMap[type];

  return (
    <Card className="shadow-sm border-border/60 h-full">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="font-display text-lg leading-snug">{title}</CardTitle>
          <Icon className="size-5 shrink-0 text-primary" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{type}</span>
          <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{level}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/60 px-2 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link to={to}>
          <Button variant="outline" className="w-full">
            Open
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
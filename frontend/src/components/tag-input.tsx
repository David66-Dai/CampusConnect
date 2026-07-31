"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
};

/** 标签输入：回车或逗号添加，点击 X 删除 */
export function TagInput({
  value,
  onChange,
  placeholder = "输入后按回车添加",
  maxTags = 20,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    const exists = value.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists || value.length >= maxTags) return;
    onChange([...value, tag]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      addTag(draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) {
            addTag(draft);
            setDraft("");
          }
        }}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                aria-label={`删除 ${tag}`}
                className="rounded-full p-0.5 hover:bg-foreground/10"
                onClick={() => onChange(value.filter((t) => t !== tag))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { EditorSkeleton } from "./Skeleton";
import { PartialBlock } from "@blocknote/core";

const Editor = dynamic(
  () => import("./Editor").then((mod) => ({ default: mod.Editor })),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  }
);

interface LazyEditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  editable?: boolean;
  editorRef?: React.MutableRefObject<any>;
}

export function LazyEditor(props: LazyEditorProps) {
  return <Editor {...props} />;
}

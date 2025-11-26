"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { KanbanCard } from "@/types";
import { KANBAN_COLUMN_CONFIG, PRIORITY_CONFIG } from "@/types";
import { KanbanColumn, Priority } from "@prisma/client";

interface KanbanBoardProps {
  cards: KanbanCard[];
  onAddCard: (column: KanbanColumn, text: string) => void;
  onUpdateCard: (cardId: string, text: string) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: -1 | 1) => void;
  onResetBoard: () => void;
}

export function KanbanBoard({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onResetBoard,
}: KanbanBoardProps) {
  const columns: KanbanColumn[] = ["TODO", "PROGRESS", "DONE"];

  const getCardsByColumn = (column: KanbanColumn) =>
    cards.filter((c) => c.column === column);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-800">
          វឌ្ឍនភាព
        </h2>
        <button
          onClick={onResetBoard}
          className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded transition-colors"
          title="Reset Board"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column}
            column={column}
            cards={getCardsByColumn(column)}
            onAddCard={(text) => onAddCard(column, text)}
            onUpdateCard={onUpdateCard}
            onDeleteCard={onDeleteCard}
            onMoveCard={onMoveCard}
            isFirst={column === "TODO"}
            isLast={column === "DONE"}
          />
        ))}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  cards: KanbanCard[];
  onAddCard: (text: string) => void;
  onUpdateCard: (cardId: string, text: string) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}

function KanbanColumnComponent({
  column,
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  isFirst,
  isLast,
}: KanbanColumnProps) {
  const config = KANBAN_COLUMN_CONFIG[column];

  return (
    <div className="bg-zinc-50/80 rounded-lg p-2 flex flex-col h-full min-h-[150px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className={`w-2 h-2 rounded-full ${config.color} ${
            "pulse" in config && config.pulse ? "animate-pulse" : ""
          }`}
        />
        <span className="text-xs font-semibold text-zinc-500">
          {config.name}
        </span>
        <span className="ml-auto text-xs text-zinc-400 font-mono">
          {cards.length}
        </span>
      </div>

      <div className="space-y-2 flex-1">
        {cards.length === 0 ? (
          <div className="h-full border border-dashed border-zinc-200 rounded text-zinc-300 text-xs flex items-center justify-center p-4">
            ទទេ
          </div>
        ) : (
          cards.map((card) => (
            <KanbanCardComponent
              key={card.id}
              card={card}
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
              onMove={onMoveCard}
              canMoveLeft={!isFirst}
              canMoveRight={!isLast}
            />
          ))
        )}
      </div>

      <AddCardButton onAdd={onAddCard} />
    </div>
  );
}

interface KanbanCardProps {
  card: KanbanCard;
  onUpdate: (cardId: string, text: string) => void;
  onDelete: (cardId: string) => void;
  onMove: (cardId: string, direction: -1 | 1) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

function KanbanCardComponent({
  card,
  onUpdate,
  onDelete,
  onMove,
  canMoveLeft,
  canMoveRight,
}: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(card.text);
  }, [card.text]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() && text !== card.text) {
      onUpdate(card.id, text.trim());
    } else {
      setText(card.text);
    }
  };

  return (
    <div className="bg-white p-3 rounded shadow-sm border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all group relative animate-fade-in">
      <div
        ref={inputRef}
        contentEditable
        suppressContentEditableWarning
        className="mb-2 outline-none text-sm font-medium text-zinc-700 break-words"
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        onInput={(e) => setText(e.currentTarget.textContent || "")}
      >
        {card.text}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-transparent group-hover:border-zinc-100 transition-colors">
        <div className="flex gap-1">
          {card.priority && (
            <span
              className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold ${
                PRIORITY_CONFIG[card.priority].className
              }`}
            >
              {PRIORITY_CONFIG[card.priority].label}
            </span>
          )}
          <button
            onClick={() => onDelete(card.id)}
            className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          {canMoveLeft && (
            <button
              onClick={() => onMove(card.id, -1)}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}
          {canMoveRight && (
            <button
              onClick={() => onMove(card.id, 1)}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddCardButton({ onAdd }: { onAdd: (text: string) => void }) {
  return (
    <button
      onClick={() => onAdd("កាតថ្មី")}
      className="w-full text-left p-1.5 mt-2 text-xs text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 rounded transition-colors flex items-center gap-1"
    >
      <Plus className="w-3 h-3" /> ថ្មី
    </button>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Video,
  MessageCircle,
  CalendarClock,
  ShieldCheck,
  ArrowLeft,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  chatSeed,
  doctor,
  doctorAutoReply,
  type ChatMessage,
} from "@/lib/mock";

export function DoctorScreen() {
  const [chatOpen, setChatOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  if (chatOpen) {
    return <ChatView onBack={() => setChatOpen(false)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[22px] font-semibold text-ink">Врач</h1>

      {/* Карточка врача */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-[18px] font-semibold text-brand">
            {doctor.initials}
          </div>
          <div className="flex-1">
            <p className="text-[16px] font-semibold text-ink">{doctor.name}</p>
            <p className="text-[13px] text-muted">{doctor.role}</p>
            <p className="text-[13px] text-muted">{doctor.clinic}</p>
          </div>
          {doctor.online && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[13px] font-medium text-ok">
              <span className="h-2 w-2 rounded-full bg-ok" />
              онлайн
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          <Button onClick={() => setVideoOpen(true)} className="w-full">
            <Video className="h-5 w-5" />
            Видеоконсультация
          </Button>
          <Button variant="secondary" onClick={() => setChatOpen(true)} className="w-full">
            <MessageCircle className="h-5 w-5" />
            Написать в чат
          </Button>
        </div>
      </Card>

      {/* Ближайший приём */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-btn bg-brand-soft">
            <CalendarClock className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] text-muted">Ближайший приём</p>
            <p className="text-[16px] font-semibold text-ink">{doctor.nextAppointment}</p>
          </div>
          <button
            onClick={() => setRescheduleOpen(true)}
            className="text-[14px] font-medium text-brand"
          >
            Перенести
          </button>
        </div>
      </Card>

      {/* Плашка доверия / 152-ФЗ */}
      <div className="flex items-center justify-center gap-1.5 px-4 text-center text-[12px] text-muted">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Данные хранятся в РФ, в соответствии с 152-ФЗ
      </div>

      <Modal open={videoOpen} onClose={() => setVideoOpen(false)} title="Видеоконсультация">
        Подключение к видеоприёму… В прототипе реальная связь не устанавливается — так
        выглядит вход в онлайн-консультацию с лечащим врачом.
      </Modal>

      <Modal open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} title="Перенос приёма">
        Скоро здесь появится выбор свободного слота в расписании врача. В прототипе функция
        отключена.
      </Modal>
    </div>
  );
}

function ChatView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(chatSeed);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fmtTime = () =>
    new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(
      new Date("2026-06-03T14:05:00"),
    );

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const mine: ChatMessage = {
      id: `me-${Date.now()}`,
      from: "me",
      text,
      time: fmtTime(),
    };
    setMessages((prev) => [...prev, mine]);
    setDraft("");
    // Фейковый автоответ врача через ~1с
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `doc-${Date.now()}`, from: "doctor", text: doctorAutoReply, time: fmtTime() },
      ]);
    }, 1100);
  };

  return (
    <div className="-m-4 flex h-full flex-col">
      {/* Шапка чата */}
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <button onClick={onBack} aria-label="Назад" className="text-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
          {doctor.initials}
        </div>
        <div>
          <p className="text-[15px] font-semibold leading-tight text-ink">{doctor.name}</p>
          <p className="text-[12px] text-ok">онлайн</p>
        </div>
      </header>

      {/* Лента сообщений */}
      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto bg-bg px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                m.from === "me"
                  ? "rounded-br-md bg-brand text-white"
                  : "rounded-bl-md border border-border bg-surface text-ink"
              }`}
            >
              <p>{m.text}</p>
              <p
                className={`mt-1 text-[11px] ${
                  m.from === "me" ? "text-white/70" : "text-muted"
                }`}
              >
                {m.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Поле ввода */}
      <div className="flex items-center gap-2 border-t border-border bg-surface px-3 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Сообщение…"
          className="h-11 flex-1 rounded-full border border-border bg-bg px-4 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand"
        />
        <button
          onClick={send}
          aria-label="Отправить"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand/90"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

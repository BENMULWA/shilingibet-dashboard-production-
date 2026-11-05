import { useState } from "react";
import { Button, Input, Modal, Popconfirm } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSend, FiTrash2 } from "react-icons/fi";

import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
} from "../services/announcementService";

const MAX_MESSAGE = 1000;

const formatWhen = (value) =>
  new Date(value).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Messages to all players. They show in the site's Announcements tab (read-only for players).
function Announcements() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: listAnnouncements,
  });
  const items = data?.data ?? [];

  const send = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      toast.success("Announcement sent to players");
      setTitle("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) => toast.error(err?.message || "Could not send the announcement"),
  });

  const remove = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      toast.success("Announcement removed");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) => toast.error(err?.message || "Could not remove the announcement"),
  });

  const trimmed = message.trim();
  const canSend = trimmed.length >= 3 && !send.isPending;

  const confirmAndSend = () => {
    Modal.confirm({
      title: "Send to all players?",
      content: (
        <div>
          <p className="mb-2 text-sm">Every player will see this in their Announcements tab straight away.</p>
          {title.trim() && <p className="font-semibold">{title.trim()}</p>}
          <p className="whitespace-pre-line">{trimmed}</p>
        </div>
      ),
      okText: "Send",
      cancelText: "Cancel",
      onOk: () => send.mutateAsync({ title: title.trim(), message: trimmed }),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-1">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Post news, downtime notices or offers. Players see them in the Support button, under Announcements. They
          cannot reply.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 md:p-5">
        <label htmlFor="announcement-title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title <span className="text-slate-400">(optional)</span>
        </label>
        <Input
          id="announcement-title"
          value={title}
          maxLength={80}
          placeholder="e.g. We are back online"
          onChange={(event) => setTitle(event.target.value)}
        />

        <label htmlFor="announcement-message" className="mb-1 mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Message
        </label>
        <Input.TextArea
          id="announcement-message"
          value={message}
          maxLength={MAX_MESSAGE}
          rows={5}
          placeholder="Write what players should know"
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="mt-1 text-right text-xs text-slate-400">
          {message.length} / {MAX_MESSAGE}
        </div>

        <Button
          type="primary"
          icon={<FiSend />}
          disabled={!canSend}
          loading={send.isPending}
          onClick={confirmAndSend}
          className="mt-3"
        >
          Send to all players
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Recent announcements
        </h2>

        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">Could not load announcements: {error.message}</p>}
        {!isLoading && !error && items.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600">
            Nothing posted yet.
          </p>
        )}

        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="min-w-0">
                {item.title && <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>}
                <p className="whitespace-pre-line break-words text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {item.author} · {formatWhen(item.createdAt)}
                </p>
              </div>
              <Popconfirm
                title="Remove this announcement?"
                description="Players will stop seeing it."
                okText="Remove"
                onConfirm={() => remove.mutate(item.id)}
              >
                <Button type="text" danger icon={<FiTrash2 />} aria-label="Remove announcement" />
              </Popconfirm>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Announcements;

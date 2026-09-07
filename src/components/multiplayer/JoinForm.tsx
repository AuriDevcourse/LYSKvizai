"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { LogIn, Sliders } from "lucide-react";
/**
 * Loaded on demand.
 *
 * The avatar picker pulls in the DiceBear engine, and `/play` used to import it
 * statically — so anyone tapping "Create game", who never sees a picker at
 * all, paid for the whole engine up front. `next/dynamic` moves it into its own
 * chunk fetched when the picker is actually rendered.
 */
const AvatarBuilder = dynamic(() => import("@/components/AvatarBuilder"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-xl bg-white/5" />,
});
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface JoinFormProps {
  initialCode?: string;
  onJoin: (code: string, name: string, emoji: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function JoinForm({ initialCode, onJoin, loading, error }: JoinFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(() => (initialCode ?? "").toUpperCase());
  const [lastInitial, setLastInitial] = useState(initialCode);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [codeFocused, setCodeFocused] = useState(false);
  const [customising, setCustomising] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const CODE_LENGTH = 4;

  /**
   * Room codes are four alphanumerics, so spaces, dashes and punctuation are
   * always noise. This only upper-cased before, so typing "ab-1" filled the
   * four-character field with "AB-1" and the join failed with no clue why.
   *
   * It deliberately does *not* try to read a code out of prose. Stripping
   * everything non-alphanumeric from "code: ab12" yields "CODEAB12", whose
   * first four characters are "CODE" — confidently wrong is worse than not
   * supported. Pasted share links are handled separately below, where the
   * answer is unambiguous.
   */
  const setCodeSanitised = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(clean);
    // Four characters in means the next thing needed is the name.
    if (clean.length === CODE_LENGTH && code.length < CODE_LENGTH) {
      nameRef.current?.focus();
    }
  };

  /**
   * Pasting the link the host shares.
   *
   * The lobby hands out `<origin>/play?code=XXXX` (see `HostLobby`), which is
   * what lands in a chat message, and pasting it into a four-character field
   * otherwise produced garbage. `code=` makes the intent unambiguous, unlike a
   * sentence, so this is the one paste shape worth special-casing.
   */
  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const fromLink = /[?&]code=([A-Za-z0-9]{1,8})/.exec(text);
    if (!fromLink) return; // fall through to the normal sanitiser
    e.preventDefault();
    setCodeSanitised(fromLink[1]);
  };

  if (initialCode !== lastInitial) {
    setLastInitial(initialCode);
    if (initialCode) setCode(initialCode.toUpperCase());
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onJoin(code.trim().toUpperCase(), name.trim(), avatar);
  };

  /**
   * The first unmet requirement, in the order the form presents them, or
   * `null` when the player can join.
   */
  const missing =
    !code.trim() ? "Enter the room code" :
    !name.trim() ? "Enter your name" :
    !avatar ? "Pick an avatar to join" :
    null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      {/*
        * The code, as four tiles.
        *
        * The host's screen shows the code in `.code-tile` boxes
        * (`RoomCodeDisplay`), and this was a single wide text field, so the
        * thing a player is copying looked nothing like the thing they typed it
        * into. Same tiles here means the two screens read as one system.
        *
        * One real input underneath does the work — it keeps the mobile
        * keyboard, paste, autofill and screen-reader behaviour that a set of
        * four separate inputs throws away. The tiles are presentation only.
        */}
      <div>
        {/* Centred with its tiles. Left-aligned, the label sat 282px away from
            the field it names and the two read as unrelated. */}
        <label htmlFor="join-code" className="font-headline mb-2 block text-center text-sm font-extrabold text-white/70">
          {t("joinForm.roomCode")}
        </label>
        <div className="relative">
          <input
            id="join-code"
            ref={codeRef}
            type="text"
            value={code}
            onChange={(e) => setCodeSanitised(e.target.value)}
            onPaste={handleCodePaste}
            onFocus={() => setCodeFocused(true)}
            onBlur={() => setCodeFocused(false)}
            maxLength={CODE_LENGTH}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="next"
            aria-label="Room code"
            // A join failure is nearly always the code, so point the field at
            // the message and mark it invalid — otherwise the error is announced
            // once and then orphaned from the thing that caused it.
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "join-error" : undefined}
            // Invisible but real: it sits over the tiles so a tap lands on it.
            // `text-transparent` rather than `opacity-0`, so the browser still
            // scrolls it into view and autofill still anchors to it.
            className="absolute inset-0 z-10 w-full cursor-pointer bg-transparent text-center text-transparent caret-transparent outline-none"
          />
          <div className="pointer-events-none flex justify-center gap-2 sm:gap-3" aria-hidden="true">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const char = code[i];
              // The next empty tile is the caret, but only while focused.
              const isCursor = codeFocused && i === code.length;
              return (
                <span
                  key={i}
                  className={`code-tile font-headline flex h-16 w-14 items-center justify-center rounded-2xl text-3xl font-extrabold text-white transition-all duration-200 sm:h-[68px] sm:w-16 sm:text-4xl ${
                    error
                      ? "ring-2 ring-error"
                      : isCursor
                        ? "ring-2 ring-primary"
                        : char
                          ? "ring-1 ring-white/15"
                          : ""
                  }`}
                >
                  {char ?? (isCursor ? <span className="animate-pulse text-primary motion-reduce:animate-none">|</span> : "")}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="join-name" className="font-headline mb-2 block text-sm font-extrabold text-white/70">
          {t("joinForm.name")}
        </label>
        <input
          id="join-name"
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("joinForm.namePlaceholder")}
          maxLength={16}
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="nickname"
          enterKeyHint="go"
          aria-label="Your name"
          className="min-h-[52px] w-full rounded-xl border-[1.5px] border-white/8 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
        />
      </div>

      {/*
        * Avatar: preview and dice always, the option grid on request.
        *
        * The grid is about 450px tall. On a 757px viewport it pushed the Join
        * button to the very bottom edge and cut the Back link off entirely,
        * measured at 42px of overflow — so the screen's actual job, a code and
        * a name, was competing for space with optional decoration.
        *
        * The builder stays mounted either way, because it emits a randomised
        * avatar on mount: a player who never opens this still joins with a
        * face, and the Join button is never blocked on it.
        */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="font-headline text-sm font-extrabold text-white/70">
            {t("joinForm.avatar")}
          </span>
          <button
            type="button"
            onClick={() => setCustomising((v) => !v)}
            aria-expanded={customising}
            className="tap-target flex items-center gap-1.5 rounded-full px-3 text-xs font-extrabold text-primary transition-colors hover:text-primary-lit"
          >
            <Sliders className="h-3.5 w-3.5" />
            {customising ? t("joinForm.avatarDone") : t("joinForm.avatarCustomise")}
          </button>
        </div>
        <AvatarBuilder onChange={setAvatar} collapsed={!customising} />
      </div>

      {/* Announced, not just shown. This was a plain paragraph, so a screen
          reader user submitting a wrong room code got no feedback at all —
          focus stayed put and nothing was read out. */}
      {error && (
        <p
          id="join-error"
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-error/20 px-3 py-2 text-sm font-bold text-white"
        >
          {error}
        </p>
      )}

      {/* Say why the button is dead.
          It greys out until all three are filled, and an avatar is the least
          obvious of them — the builder looks decorative, so a player with
          their code and name typed would sit staring at a disabled button
          with nothing telling them what was missing. */}
      {missing && !loading && (
        <p
          id="join-blocked-reason"
          className="text-center text-xs font-bold text-white/50"
        >
          {missing}
        </p>
      )}

      <button
        type="submit"
        disabled={Boolean(missing) || loading}
        aria-describedby={missing ? "join-blocked-reason" : undefined}
        className="btn-primary flex items-center justify-center gap-2 w-full disabled:opacity-50"
      >
        <LogIn className="h-5 w-5" />
        {loading ? t("joinForm.joining") : t("joinForm.join")}
      </button>
    </form>
  );
}

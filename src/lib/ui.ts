/** Shared Tailwind class strings so every screen has the same 44px targets and focus rings. */
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

export const ui = {
  buttonPrimary: `inline-flex min-h-11 items-center justify-center gap-2 rounded bg-neutral-900 px-4 font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400 ${focus}`,
  buttonSecondary: `inline-flex min-h-11 items-center justify-center gap-2 rounded border border-neutral-400 bg-white px-4 font-medium text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-400 ${focus}`,
  buttonDanger: `inline-flex min-h-11 items-center justify-center gap-2 rounded bg-red-700 px-4 font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400 ${focus}`,
  link: `inline-flex min-h-11 items-center text-blue-800 underline underline-offset-2 ${focus}`,
  input: `min-h-11 w-full rounded border border-neutral-400 bg-white px-3 py-2 text-neutral-900 aria-[invalid=true]:border-red-700 ${focus}`,
  label: "block text-sm font-medium text-neutral-800",
  card: "rounded-lg border border-neutral-200 bg-white p-4",
  focus,
};

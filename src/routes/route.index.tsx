import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/route/")({
  beforeLoad: () => {
    throw redirect({ to: "/wayfinder" });
  },
  component: () => null,
});

/**
 * Страница расписания занятий — /schedule
 *
 * Компонент SchedulePage использует fetch на клиенте (Anthropic API),
 * поэтому SSR отключён через dynamic import с { ssr: false }.
 * getServerSideProps здесь не нужен.
 */

import dynamic from "next/dynamic";

const SchedulePage = dynamic(
  () => import("../components/SchedulePage"),
  { ssr: false, loading: () => null }
);

export default function ScheduleRoute() {
  return <SchedulePage />;
}

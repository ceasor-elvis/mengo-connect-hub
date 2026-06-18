import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { WsStatusProvider, useWsStatus } from "@/contexts/WsStatusContext";
import { setElectionState, setElectionSchedule } from "@/data/appStore";
import type { WsMessage } from "@/data/api";

function GlobalWsStoreSync() {
  const { subscribe } = useWsStatus();

  useEffect(() => {
    return subscribe((msg: WsMessage) => {
      switch (msg.type) {
        case "election_state_changed":
          if (msg.data?.state) setElectionState(msg.data.state);
          break;
        case "schedule_updated":
          if (msg.data?.start_time && msg.data?.end_time)
            setElectionSchedule(msg.data.start_time, msg.data.end_time);
          break;
      }
    });
  }, [subscribe]);

  return null;
}

export default function EvoteLayout() {
  return (
    <WsStatusProvider>
      <GlobalWsStoreSync />
      <Outlet />
    </WsStatusProvider>
  );
}

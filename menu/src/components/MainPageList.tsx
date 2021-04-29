import React, { useState } from "react";
import { txAdminMenuPage, usePageContext } from "../provider/PageProvider";
import { Collapse, List } from "@material-ui/core";
import { MenuListItem } from "./MenuListItem";
import {
  AccessibilityNew,
  Announcement,
  Build,
  DirectionsCar,
  LocalHospital,
  LocationSearching,
} from "@material-ui/icons";
import { useArrowKeys } from "../hooks/useArrowKeys";

export const MainPageList: React.FC = () => {
  const [curSelected, setCurSelected] = useState(0);

  const { page } = usePageContext();

  const handleArrowDown = () => {
    if (curSelected <= 4) setCurSelected(curSelected + 1);
  };
  const handleArrowUp = () => {
    if (curSelected > 0) setCurSelected(curSelected - 1);
  };

  useArrowKeys({
    onDownDown: handleArrowDown,
    onUpDown: handleArrowUp,
  });

  return (
    <Collapse in={page === txAdminMenuPage.Main} mountOnEnter unmountOnExit>
      <List>
        <MenuListItem
          selected={curSelected === 0}
          icon={<LocationSearching />}
          primary="Teleport"
          secondary="Teleport with context"
          onSelect={() => console.log("Teleport Clicked")}
        />
        <MenuListItem
          selected={curSelected === 1}
          icon={<AccessibilityNew />}
          primary="Player Mode"
          secondary="Current: NoClip"
          onSelect={() => console.log("Player Mode Clicked")}
        />
        <MenuListItem
          selected={curSelected === 2}
          icon={<DirectionsCar />}
          primary="Spawn Vehicle"
          secondary="Uses model name"
          onSelect={() => console.log("Spawn Vehicle Clicked")}
        />
        <MenuListItem
          selected={curSelected === 3}
          icon={<Build />}
          primary="Fix Vehicle"
          secondary="Set current vehicle health to 100%"
          onSelect={() => console.log("Fix Vehicle Clicked")}
        />
        <MenuListItem
          selected={curSelected === 4}
          icon={<LocalHospital />}
          primary="Heal All Players"
          secondary="Will heal all players to full health"
          onSelect={() => console.log("Heal All Clicked")}
        />
        <MenuListItem
          selected={curSelected === 5}
          icon={<Announcement />}
          primary="Send Announcement"
          secondary="Announce a message"
          onSelect={() => console.log("Send announcement Clicked")}
        />
      </List>
    </Collapse>
  );
};

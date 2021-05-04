import React, {useEffect, useState} from "react";
import { List } from "@material-ui/core";
import MenuListItem, { MenuListItemData } from "./MenuListItem";
import {
  AccessibilityNew,
  Announcement,
  Build,
  DirectionsCar,
  LocalHospital,
  LocationSearching,
} from "@material-ui/icons";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useDialogContext } from "../provider/DialogProvider";
import { fetchNui } from "../utils/fetchNui";
import { useSnackbarContext } from "../provider/SnackbarProvider";
import { useKeyboardNavContext } from "../provider/KeyboardNavProvider";
import { useTranslate } from "react-polyglot";

export const MainPageList: React.FC = () => {
  const { openDialog } = useDialogContext();
  const { openSnackbar } = useSnackbarContext();
  const { setDisabledKeyNav } = useKeyboardNavContext()
  const [curSelected, setCurSelected] = useState(0);
  const t = useTranslate()

  // the directions are inverted
  const handleArrowDown = () => {
    const next = (curSelected + 1);
    setCurSelected((next >= menuListItems.length) ? 0 : next);
  };
  const handleArrowUp = () => {
    const next = (curSelected - 1);
    setCurSelected((next < 0) ? (menuListItems.length - 1) : next)
  };

  const handleEnter = () => {
    menuListItems[curSelected].onSelect();
  };

  useEffect(() => {
    setDisabledKeyNav(false)
    return () => setDisabledKeyNav(true)
  }, [setDisabledKeyNav]);


  useKeyboardNavigation({
    onDownDown: handleArrowDown,
    onUpDown: handleArrowUp,
    onEnterDown: handleEnter,
    disableOnFocused: true
  });

  const handleTeleport = () => {
    openDialog({
      description: t("nui_menu.page_main.teleport.dialog_secondary"),
      title: t("nui_menu.page_main.teleport.dialog_title"),
      placeholder: "340, 480, 12",
      onSubmit: (coords: string) => {
        const [x, y, z] = coords.split(',').map(s => s.trim())
          .filter(s => s.match(/^-?\d{1,4}(?:\.\d{1,9})?$/))
          .map(s => +s);

        if ([x, y, z].every(n => (typeof n === 'number'))) {
          openSnackbar("success", t("nui_menu.page_main.teleport.dialog_success"));
          fetchNui("tpToCoords", {x, y, z});
        } else {
          openSnackbar("error", t("nui_menu.page_main.teleport.dialog_error"))
        }
      }
    });
  }

  const handleAnnounceMessage = () => {
    openDialog({
      description: t("nui_menu.page_main.send_announce.dialog_desc"),
      title: t("nui_menu.page_main.send_announce.dialog_title"),
      placeholder: "Your announcement...",
      onSubmit: (message: string) => {
        // Post up to client with announcement message
        openSnackbar("success", t("nui_menu.page_main.send_announce.dialog_success"));
        fetchNui("sendAnnouncement", {message});
      },
    });
  };

  const handleSpawnVehicle = () => {
    openDialog({
      description: t("nui_menu.page_main.spawn_veh.dialog_desc"),
      title: t("nui_menu.page_main.spawn_veh.dialog_title"),
      placeholder: "Adder",
      onSubmit: (modelName: string) => {
        openSnackbar("info", t("nui_menu.page_main.spawn_veh.dialog_info", { modelName }));
        fetchNui("spawnVehicle", {model: modelName}).then(({e}) => {
          e ? openSnackbar("error", t("nui_menu.page_main.spawn_veh.dialog_error", { modelName }))
            : openSnackbar("success", t("nui_menu.page_main.spawn_veh.dialog_success"));
        });
      },
    });
  };

  const handleFixVehicle = () => {
    fetchNui("fixVehicle");
    openSnackbar("info", t("nui_menu.page_main.fix_vehicle.dialog_success"));
  };

  const handleHealAllPlayers = () => {
    fetchNui("healAllPlayers");
    openSnackbar("info", t("nui_menu.page_main.heal_all.dialog_success"));
  };

  const menuListItems: MenuListItemData[] = [
    {
      icon: <LocationSearching />,
      primary: t("nui_menu.page_main.teleport.list_primary"),
      secondary: t("nui_menu.page_main.teleport.list_secondary"),
      onSelect: handleTeleport,
    },
    {
      icon: <AccessibilityNew />,
      primary: t("nui_menu.page_main.player_mode.list_primary"),
      secondary: t("nui_menu.page_main.player_mode.list_secondary",
        { no_clip: 'NoClip' }
      ),
      onSelect: () => console.log("Player Mode Clicked"),
    },
    {
      icon: <DirectionsCar />,
      primary: t("nui_menu.page_main.spawn_veh.list_primary"),
      secondary: t("nui_menu.page_main.spawn_veh.list_secondary"),
      onSelect: handleSpawnVehicle,
    },
    {
      icon: <Build />,
      primary: t("nui_menu.page_main.fix_vehicle.list_primary"),
      secondary: t("nui_menu.page_main.fix_vehicle.list_secondary"),
      onSelect: handleFixVehicle,
    },
    {
      icon: <LocalHospital />,
      primary: t("nui_menu.page_main.heal_all.list_primary"),
      secondary: t("nui_menu.page_main.heal_all.list_secondary"),
      onSelect: handleHealAllPlayers,
    },
    {
      icon: <Announcement />,
      primary: t("nui_menu.page_main.send_announce.list_primary"),
      secondary: t("nui_menu.page_main.send_announce.list_secondary"),
      onSelect: handleAnnounceMessage,
    },
  ];

  return (
    <List>
      {menuListItems.map((item, index) => (
        <MenuListItem
          key={index}
          selected={curSelected === index}
          {...item}
        />
      ))}
    </List>
  );
};

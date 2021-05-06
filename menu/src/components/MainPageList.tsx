import React, { useEffect, useState } from "react";
import { List } from "@material-ui/core";
import { MenuListItem, MenuListItemMulti } from "./MenuListItem";
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
import { useKeyboardNavContext } from "../provider/KeyboardNavProvider";
import { useTranslate } from "react-polyglot";
import { useSnackbar } from "notistack";
import {usePlayerMode} from "../state/playermode.state";

export const MainPageList: React.FC = () => {
  const { openDialog } = useDialogContext();
  const { setDisabledKeyNav } = useKeyboardNavContext();
  const [curSelected, setCurSelected] = useState(0);
  const t = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const [playerMode, setPlayerMode] = usePlayerMode()

  // the directions are inverted
  const handleArrowDown = () => {
    const next = curSelected + 1;
    setCurSelected(next >= menuListItems.length ? 0 : next);
  };
  const handleArrowUp = () => {
    const next = curSelected - 1;
    setCurSelected(next < 0 ? menuListItems.length - 1 : next);
  };

  const handleEnter = () => {
    menuListItems[curSelected].onSelect && menuListItems[curSelected].onSelect();
  };

  useEffect(() => {
    setDisabledKeyNav(false);
    return () => setDisabledKeyNav(true);
  }, [setDisabledKeyNav]);

  useKeyboardNavigation({
    onDownDown: handleArrowDown,
    onUpDown: handleArrowUp,
    onEnterDown: handleEnter,
    disableOnFocused: true,
  });

  const handleTeleport = () => {
    openDialog({
      description: t("nui_menu.page_main.teleport.dialog_desc"),
      title: t("nui_menu.page_main.teleport.dialog_title"),
      placeholder: "340, 480, 12",
      onSubmit: (coords: string) => {
        const [x, y, z] = coords
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.match(/^-?\d{1,4}(?:\.\d{1,9})?$/))
          .map((s) => +s);

        if ([x, y, z].every((n) => typeof n === "number")) {
          enqueueSnackbar(t("nui_menu.page_main.teleport.dialog_success"), {
            variant: "success",
          });
          fetchNui("tpToCoords", { x, y, z });
        } else {
          enqueueSnackbar(t("nui_menu.page_main.teleport.dialog_error"), {
            variant: "error",
          });
        }
      },
    });
  };

  const handleAnnounceMessage = () => {
    openDialog({
      description: t("nui_menu.page_main.send_announce.dialog_desc"),
      title: t("nui_menu.page_main.send_announce.dialog_title"),
      placeholder: "Your announcement...",
      isMultiline: true,
      onSubmit: (message: string) => {
        // Post up to client with announcement message
        enqueueSnackbar(t("nui_menu.page_main.send_announce.dialog_success"), {
          variant: "success",
        });
        fetchNui("sendAnnouncement", { message });
      },
    });
  };

  const handleSpawnVehicle = () => {
    openDialog({
      description: t("nui_menu.page_main.spawn_veh.dialog_desc"),
      title: t("nui_menu.page_main.spawn_veh.dialog_title"),
      placeholder: "Adder",
      onSubmit: (modelName: string) => {
        enqueueSnackbar(
          t("nui_menu.page_main.spawn_veh.dialog_info", { modelName }),
          { variant: "info" }
        );
        fetchNui("spawnVehicle", { model: modelName }).then(({ e }) => {
          e
            ? enqueueSnackbar(
                t("nui_menu.page_main.spawn_veh.dialog_error", { modelName }),
                { variant: "error" }
              )
            : enqueueSnackbar(
                t("nui_menu.page_main.spawn_veh.dialog_success"),
                { variant: "success" }
              );
        });
      },
    });
  };

  const handleFixVehicle = () => {
    fetchNui("fixVehicle").then(({ e }) => {
      if (e) {
        return enqueueSnackbar(t("nui_menu.page_main.fix_vehicle.dialog_error"), {
          variant: "error",
        });
      }

      enqueueSnackbar(t("nui_menu.page_main.fix_vehicle.dialog_success"), {
        variant: "info",
      });
    });
  };

  const handleHealAllPlayers = () => {
    fetchNui("healAllPlayers");
    enqueueSnackbar(t("nui_menu.page_main.heal_all.dialog_success"), {
      variant: "info",
    });
  };

  const menuListItems = [
    {
      icon: <LocationSearching />,
      primary: t("nui_menu.page_main.teleport.list_primary"),
      secondary: t("nui_menu.page_main.teleport.list_secondary"),
      onSelect: handleTeleport,
    },
    {
      icon: <AccessibilityNew />,
      primary: t("nui_menu.page_main.player_mode.list_primary"),
      secondary: t("nui_menu.page_main.player_mode.list_secondary", {
        no_clip: "NoClip",
      }),
      isMultiAction: true,
      onChange: (playerMode) => {
        setPlayerMode(playerMode)
        fetchNui('playerModeChanged', playerMode)
      },
      initialValue: playerMode,
      actions: [
        {
          label: "None",
          value: "none",
        },
        {
          label: "NoClip",
          value: "noclip",
        },
        {
          label: "God Mode",
          value: "godmode",
        },
      ],
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
        // @ts-ignore
        item.isMultiAction ? <MenuListItemMulti key={index} selected={curSelected === index} {...item} /> : <MenuListItem key={index} selected={curSelected === index} {...item} />
      ))}
    </List>
  );
};

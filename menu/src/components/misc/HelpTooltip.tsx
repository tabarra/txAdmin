import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Fade, Theme, Tooltip, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { txAdminMenuPage, usePageValue } from "../../state/page.state";
import { useIsMenuVisibleValue } from "../../state/visibility.state";
import { useDialogContext } from "../../provider/DialogProvider";
import { useTranslate } from "react-polyglot";
import { useServerCtxValue } from "../../state/server.state";

const RANDOM_CHANGE_TIME = 12000;
const TIME_FOR_TOOLTIP_TO_APPEAR = 3000;

const useStyles = makeStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderRadius: 10,
    padding: 10,
    transformOrigin: "bottom",
    animationIterationCount: "infinite",
    animationDuration: "2s",
    animationName: "$bounce-tool-tip",
    animationTimingFunction: "ease",
  },
  arrow: {
    color: theme.palette.background.default,
  },
  "@keyframes bounce-tool-tip": {
    "0%": {
      transform: "translateY(0)",
    },
    "50%": {
      transform: "translateY(3px)",
    },
    "100%": {
      transform: "translateY(0)",
    },
  },
}));

const rootEl = document.getElementById("#root");

export const HelpTooltip: React.FC = ({ children }) => {
  const classes = useStyles();
  const timeTillOpenRef = useRef<NodeJS.Timer | null>(null);
  const changeMsgTimeRef = useRef<NodeJS.Timer | null>();
  const t = useTranslate();
  const serverCtx = useServerCtxValue();
  const isMenuVisible = useIsMenuVisibleValue();
  const { isDialogOpen } = useDialogContext();

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");

  const formattedPageKey = `[${serverCtx.switchPageKey.toUpperCase()}]`;

  const toolTipMessages = useMemo(
    () => [
      t("nui_menu.page_main.tooltips.tooltip_1", { key: formattedPageKey }),
      t("nui_menu.page_main.tooltips.tooltip_2"),
    ],
    [t, formattedPageKey]
  );

  const getNewTooltip = useCallback((): string => {
    const generateNewTooltipRandomly = () =>
      toolTipMessages[Math.floor(Math.random() * toolTipMessages.length)];

    let newTooltip = generateNewTooltipRandomly();
    while (newTooltip === tooltipContent) {
      newTooltip = generateNewTooltipRandomly();
    }

    return newTooltip;
  }, [toolTipMessages]);

  const curPage = usePageValue();

  useEffect(() => {
    if (!isMenuVisible) setTooltipOpen(false);
  }, [isMenuVisible]);

  useEffect(() => {
    if (isDialogOpen) setTooltipOpen(false);
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isMenuVisible) return;

    if (curPage === txAdminMenuPage.Main) {
      timeTillOpenRef.current = setTimeout(() => {
        const msg = getNewTooltip();
        setTooltipOpen(true);
        setTooltipContent(msg);
      }, TIME_FOR_TOOLTIP_TO_APPEAR);
    } else {
      setTooltipOpen(false);
    }

    return () => {
      if (timeTillOpenRef.current) {
        clearTimeout(timeTillOpenRef.current);
        timeTillOpenRef.current = null;
      }
    };
  }, [curPage, isMenuVisible]);

  useEffect(() => {
    if (tooltipOpen) {
      changeMsgTimeRef.current = setInterval(() => {
        const tooltip = getNewTooltip();
        setTooltipContent(tooltip);
        changeMsgTimeRef.current = null;
      }, RANDOM_CHANGE_TIME);
    } else {
      changeMsgTimeRef.current = null;
    }

    return () => {
      if (changeMsgTimeRef.current) {
        clearInterval(changeMsgTimeRef.current);
        changeMsgTimeRef.current = null;
      }
    };
  }, [tooltipOpen]);

  return (
    <Tooltip
      open={tooltipOpen}
      title={
        <Typography variant="caption" align="center">
          {tooltipContent}
        </Typography>
      }
      PopperProps={{
        container: rootEl,
      }}
      arrow
      TransitionComponent={Fade}
      TransitionProps={{
        timeout: {
          enter: 500,
          appear: 500,
          exit: 50,
        },
      }}
      classes={{
        tooltip: classes.tooltip,
        arrow: classes.arrow,
      }}
    >
      <div>{children}</div>
    </Tooltip>
  );
};

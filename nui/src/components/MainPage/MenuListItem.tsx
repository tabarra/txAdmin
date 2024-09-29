import React, { memo, useEffect, useRef, useState } from "react";
import { styled, Theme } from '@mui/material/styles';
import {
  Box,
  BoxProps,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { Code } from "@mui/icons-material";
import { fetchNui } from "../../utils/fetchNui";
import { useTranslate } from "react-polyglot";
import {
  ResolvablePermission,
  usePermissionsValue,
} from "../../state/permissions.state";
import { userHasPerm } from "../../utils/miscUtils";
import { useSnackbar } from "notistack";
import { useTooltip } from "../../provider/TooltipProvider";

const PREFIX = 'MenuListItem';

const classes = {
  root: `${PREFIX}-root`,
  rootDisabled: `${PREFIX}-rootDisabled`,
  icon: `${PREFIX}-icon`,
  largeIcon: `${PREFIX}-largeIcon`,
  largeTypography: `${PREFIX}-largeTypography`,
  overrideText: `${PREFIX}-overrideText`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    borderRadius: 15,
  },

  [`& .${classes.rootDisabled}`]: {
    borderRadius: 15,
    opacity: 0.3,
  },

  [`& .${classes.icon}`]: {
    color: theme.palette.text.secondary,
  },

  [`& .${classes.overrideText}`]: {
    color: theme.palette.text.primary,
    fontSize: 16,
  },
  '@media (min-height: 2160px)': {
    [`& .${classes.root}`]: {
      padding: 12,
      borderRadius: 20,
    },
    [`& .${classes.icon}`]: {
      fontSize: '2.8rem',
      padding: 8,
    },
    [`& .${classes.largeIcon}`]: {
      fontSize: '2.8rem',
    },
    [`& .${classes.overrideText}`]: {
      fontSize: '2.4rem',
      marginLeft: 50,
    },
    [`& .${classes.largeTypography}`]: {
      fontSize: '2.4rem',
    },
  },
}));

export interface MenuListItemProps {
  title: string;
  label: string;
  requiredPermission?: ResolvablePermission;
  icon: JSX.Element;
  selected: boolean;
  onSelect: () => void;
}


export const MenuListItem: React.FC<MenuListItemProps> = memo(
  ({ title, label, requiredPermission, icon, selected, onSelect }) => {

    const t = useTranslate();
    const divRef = useRef<HTMLDivElement | null>(null);
    const userPerms = usePermissionsValue();
    const isUserAllowed = requiredPermission
      ? userHasPerm(requiredPermission, userPerms)
      : true;
    const { enqueueSnackbar } = useSnackbar();
    const { setTooltipText } = useTooltip();

    const handleEnter = (): void => {
      if (!selected) return;

      if (!isUserAllowed) {
        enqueueSnackbar(t("nui_menu.misc.no_perms"), {
          variant: "error",
          anchorOrigin: {
            horizontal: "center",
            vertical: "bottom",
          },
        });
        return;
      }

      fetchNui("playSound", "enter");
      onSelect();
    };

    useEffect(() => {
      if (selected && divRef) {
        divRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }, [selected]);

    useEffect(() => {
      if (selected) {
        setTooltipText(label);
      }
    }, [selected]);

    useKeyboardNavigation({
      onEnterDown: handleEnter,
      disableOnFocused: true,
    });

    return (
      <Root ref={divRef}>
        <ListItem
          style={{ maxHeight: 'none', overflow: 'visible' }}
          onClick={() => onSelect()}
          className={isUserAllowed ? classes.root : classes.rootDisabled}
          dense
          selected={selected}
        >
          <ListItemIcon className={classes.icon}>
            {React.cloneElement(icon, { className: classes.largeIcon })}
          </ListItemIcon>
          <ListItemText
            primary={title}
            classes={{
              primary: classes.overrideText,
            }}
          />
        </ListItem>
      </Root>
    );
  }
);

interface MenuListItemMultiAction {
  name?: string | JSX.Element;
  label: string;
  value: string | number | boolean;
  icon?: JSX.Element;
  onSelect: () => void;
}

export interface MenuListItemMultiProps {
  title: string;
  requiredPermission?: ResolvablePermission;
  initialValue?: MenuListItemMultiAction;
  selected: boolean;
  icon: JSX.Element;
  actions: MenuListItemMultiAction[];
}

export const MenuListItemMulti: React.FC<MenuListItemMultiProps> = memo(
  ({ selected, title, actions, icon, initialValue, requiredPermission }) => {

    const t = useTranslate();
    const [curState, setCurState] = useState(0);
    const userPerms = usePermissionsValue();
    const { enqueueSnackbar } = useSnackbar();
    const { setTooltipText } = useTooltip();

    const isUserAllowed = requiredPermission && userHasPerm(requiredPermission, userPerms);

    const compMounted = useRef(false);

    const divRef = useRef<HTMLDivElement | null>(null);

    const showNotAllowedAlert = () => {
      enqueueSnackbar(t("nui_menu.misc.no_perms"), {
        variant: "error",
        anchorOrigin: {
          horizontal: "center",
          vertical: "bottom",
        },
      });
    };

    useEffect(() => {
      if (selected && divRef) {
        divRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }, [selected]);

    // Mount/unmount detection
    // We will only run this hook after initial mount
    // and not on unmount.
    // NOTE: This hook does not work if actions prop are dynamic
    useEffect(() => {
      if (!compMounted.current) {
        compMounted.current = true;
        // We will set the initial value of the item based on the passed initial value
        const index = actions.findIndex((a) => a.value === initialValue?.value);
        setCurState(index > -1 ? index : 0);
      }
    }, [curState]);

    useEffect(() => {
      if (actions[curState]?.label && selected) {
        setTooltipText(actions[curState]?.label);
      }
    }, [curState, selected]);

    const handleLeftArrow = () => {
      if (!selected) return;

      fetchNui("playSound", "move").catch();
      const nextEstimatedItem = curState - 1;
      const nextItem =
        nextEstimatedItem < 0 ? actions.length - 1 : nextEstimatedItem;
      setCurState(nextItem);
    };

    const handleRightArrow = () => {
      if (!selected) return;

      fetchNui("playSound", "move");
      const nextEstimatedItem = curState + 1;
      const nextItem =
        nextEstimatedItem >= actions.length ? 0 : nextEstimatedItem;
      setCurState(nextItem);
    };

    const handleEnter = () => {
      if (!selected) return;
      if (!isUserAllowed) return showNotAllowedAlert();

      fetchNui("playSound", "enter").catch();
      actions[curState].onSelect();
    };

    useKeyboardNavigation({
      onRightDown: handleRightArrow,
      onLeftDown: handleLeftArrow,
      onEnterDown: handleEnter,
      disableOnFocused: true,
    });

    return (
      <Root ref={divRef}>
        <ListItem
          className={isUserAllowed ? classes.root : classes.rootDisabled}
          dense
          selected={selected}
        >
          <ListItemIcon className={classes.icon}>
            {React.cloneElement(actions[curState]?.icon ?? icon, { className: classes.largeIcon })}
          </ListItemIcon>
          <ListItemText
            primary={
              <>
                {title}:&nbsp;
                <Typography component="span" color="text.secondary" className={classes.largeTypography}>
                  {actions[curState]?.name ?? "???"}
                </Typography>
              </>
            }
            classes={{
              primary: classes.overrideText,
            }}
          />
          <ListItemSecondaryAction>
            <Code className={classes.icon} />
          </ListItemSecondaryAction>
        </ListItem>
      </Root>
    );
  }
);

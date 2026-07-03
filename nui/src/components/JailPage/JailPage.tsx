import React, { useEffect, useState } from "react";
import { styled } from '@mui/material/styles';
import { Box, Fade, Typography } from "@mui/material";
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { useTranslate } from "react-polyglot";
import { debugData } from "../../utils/debugData";
import { LockOutlined } from "@mui/icons-material";


/**
 * Jail box
 */
const boxClasses = {
  root: `JailBox-root`,
  inner: `JailBox-inner`,
  title: `JailBox-title`,
  row: `JailBox-row`,
  label: `JailBox-label`,
  instruction: `JailBox-instruction`
};

const JailInnerStyles = styled('div')({
  color: "whitesmoke",
  maxWidth: "700px",

  [`& .${boxClasses.inner}`]: {
    padding: 32,
    border: "3px dashed whitesmoke",
    borderRadius: 12,
  },
  [`& .${boxClasses.title}`]: {
    display: "flex",
    margin: "-20px auto 18px auto",
    width: "max-content",
    borderBottom: "2px solid whitesmoke",
    paddingBottom: 5,
    fontWeight: 700,
  },
  [`& .${boxClasses.row}`]: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    fontSize: "1.15em",
    marginTop: 10,
  },
  [`& .${boxClasses.label}`]: {
    opacity: 0.8,
  },
  [`& .${boxClasses.instruction}`]: {
    marginTop: "1.5em",
    textAlign: "center",
    opacity: 0.85,
  },
});

const JailIcon = () => (
  <LockOutlined
    style={{
      color: "whitesmoke",
      padding: "0 4px 0 4px",
      height: "3rem",
      width: "3rem",
    }}
  />
);

const formatRemaining = (totalSeconds: number) => {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
};

/**
 * Main jail container (whole page)
 */
const mainClasses = {
  root: `MainJail-root`,
}

const MainPageStyles = styled('div')(({
  [`& .${mainClasses.root}`]: {
    top: 0,
    left: 0,
    position: "absolute",
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    gap: "1em",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(20, 20, 24, 0.92)",
  },
}));

export interface SetJailOpenData {
  author: string;
  reason: string;
  remainingSeconds: number;
}

export const JailPage: React.FC = ({ }) => {
  const t = useTranslate();
  const [isOpen, setIsOpen] = useState(false);
  const [jailData, setJailData] = useState<SetJailOpenData | null>(null);
  const [secsRemaining, setSecsRemaining] = useState(0);

  useNuiEvent<SetJailOpenData>("setJailOpen", (jailData) => {
    setJailData(jailData);
    setSecsRemaining(jailData.remainingSeconds);
    setIsOpen(true);
  });

  useNuiEvent("closeJail", () => {
    setIsOpen(false);
  });

  //Ticks the countdown down locally between server resyncs
  useEffect(() => {
    if (!isOpen) return;
    const tickTimer = setInterval(() => {
      setSecsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tickTimer);
  }, [isOpen]);

  return (
    <MainPageStyles>
      <Fade in={isOpen}>
        <Box className={mainClasses.root}>
          <JailInnerStyles className={boxClasses.root}>
            <Box className={boxClasses.inner}>
              <Box className={boxClasses.title}>
                <JailIcon />
                <Typography variant="h3" style={{ fontWeight: 700 }}>
                  {t("nui_jail.title")}
                </Typography>
                <JailIcon />
              </Box>
              <Box className={boxClasses.row}>
                <span className={boxClasses.label}>{t("nui_jail.jailed_by")}</span>
                <span>{jailData?.author ?? ''}</span>
              </Box>
              <Box className={boxClasses.row}>
                <span className={boxClasses.label}>{t("nui_jail.reason_label")}</span>
                <span>{jailData?.reason ?? ''}</span>
              </Box>
              <Box className={boxClasses.row}>
                <span className={boxClasses.label}>{t("nui_jail.remaining_label")}</span>
                <span>{formatRemaining(secsRemaining)}</span>
              </Box>
            </Box>
            <Box className={boxClasses.instruction} fontWeight={600} letterSpacing={1}>
              {t("nui_jail.instruction")}
            </Box>
          </JailInnerStyles>
        </Box>
      </Fade>
    </MainPageStyles>
  );
};

/**
 * Browser mock
 */
// debugData([
//   {
//     action: 'setJailOpen',
//     data: {
//       author: 'Tabby',
//       reason: 'Being bad',
//       remainingSeconds: 125,
//     }
//   }
// ], 500)

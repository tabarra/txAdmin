import React from "react";
import { Box, Collapse, styled, Typography, useTheme } from "@mui/material";
import { PageTabs} from "@nui/src/components/misc/PageTabs";
import { txAdminMenuPage, usePageValue } from "@nui/src/state/page.state";
import { MainPageList } from "@nui/src/components/MainPage/MainPageList";
import { useServerCtxValue } from "@nui/src/state/server.state";
import { useDebounce } from "@nui/src/hooks/useDebouce";

interface TxAdminLogoProps {
  themeName: string;
}

const StyledImage = styled('img')({
  width: '100%',
  maxWidth: '200px', 
  '@media (min-height: 2160px)': {
    maxWidth: '300px', 
  },
});

const StyledTypography = styled(Typography)({
  fontWeight: 500,
  marginTop: -20,
  textAlign: "right",
  fontSize: 12,
  '@media (min-height: 2160px)': {
    fontSize: 20, 
    marginTop: -32,
    marginRight: 65,
  },
});

const TxAdminLogo: React.FC<TxAdminLogoProps> = ({ themeName }) => {
  const imgName = themeName === 'fivem' ? 'txadmin.png' : 'txadmin-redm.png';
  return (
    <Box my={1} display="flex" justifyContent="center">
      <StyledImage src={`images/${imgName}`} alt="txAdmin logo" />
    </Box>
  );
};

const StyledRoot = styled(Box)(({ theme }) => ({
  height: "fit-content",
  background: theme.palette.background.default,
  width: 325,
  borderRadius: 15,
  display: "flex",
  flexDirection: "column",
  userSelect: "none",
  '@media (min-height: 2160px)': {
    width: 750,
    borderRadius: 30,
  },
}));

export const MenuRootContent: React.FC = React.memo(() => {
  const theme = useTheme();
  const serverCtx = useServerCtxValue();
  const curPage = usePageValue()
  const padSize = Math.max(0, 9 - serverCtx.txAdminVersion.length);
  const versionPad = "\u0020\u205F".repeat(padSize);

  // Hack to prevent collapse transition from breaking
  // In some cases, i.e, when setting target player from playerModal
  // Collapse transition can break due to multiple page updates within a short
  // time frame
  const debouncedCurPage = useDebounce(curPage, 50)

  return (
    <StyledRoot p={2} pb={1}>
      <TxAdminLogo themeName={theme.name}/>
      <StyledTypography color="textSecondary">
        v{serverCtx.txAdminVersion}
        {versionPad}
      </StyledTypography>
      <PageTabs />
      <Collapse
        in={debouncedCurPage === txAdminMenuPage.Main}
        unmountOnExit
        mountOnEnter
      >
        <MainPageList />
      </Collapse>
    </StyledRoot>)
});

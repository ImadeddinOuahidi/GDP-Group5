import React from 'react';
import { render } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { I18nProvider } from '../i18n';

const theme = createTheme();

export function renderWithProviders(ui) {
  return render(
    <ThemeProvider theme={theme}>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  );
}

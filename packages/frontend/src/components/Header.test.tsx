import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Header } from './Header';
import { ThemeProvider } from 'styled-components';
import { theme } from '../styles/GlobalStyle';

describe('Header', () => {
  it('타이틀과 서브타이틀을 렌더링한다', () => {
    render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>,
    );

    expect(screen.getByText('리밸런싱 헬퍼')).toBeInTheDocument();
    expect(
      screen.getByText('포트폴리오 리밸런싱을 위한 조회 전용 도구'),
    ).toBeInTheDocument();
  });
});

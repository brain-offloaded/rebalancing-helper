import { ApolloProvider } from '@apollo/client';
import styled, { ThemeProvider } from 'styled-components';
import { apolloClient } from './apollo-client';
import { GlobalStyle, theme } from './styles/GlobalStyle';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AppContainer>
          <Header />
          <Dashboard />
        </AppContainer>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './apollo-client';
import './App.css';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <div className="App">
        <header style={{ 
          backgroundColor: '#007bff', 
          color: 'white', 
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h1>리밸런싱 헬퍼</h1>
          <p>포트폴리오 리밸런싱을 위한 조회 전용 도구</p>
        </header>
        <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2>증권사 계정 관리</h2>
            <p>증권사 API를 통해 보유 종목을 연동합니다.</p>
            <button style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              계정 추가
            </button>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>GraphQL 연결 테스트</h3>
            <p>백엔드 서버: <a href="http://localhost:3000/graphql" target="_blank">http://localhost:3000/graphql</a></p>
          </div>
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;

import usePresenceHandshake from './hooks/usePresenceHandshake';

function App() {
  const visitorName = usePresenceHandshake();

  return (
    <div>
      {/* If visitorName exists, SOVRYN has recognized them! */}
      {visitorName && <h1>The Truth welcomes you, {visitorName}.</h1>}
      
      {/* Rest of your beautiful localhost build */}
    </div>
  );
}
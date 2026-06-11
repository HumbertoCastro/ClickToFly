const embers = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  x: `${(index * 37) % 100}%`,
  y: `${(index * 19) % 100}%`,
  delay: `${(index % 9) * 0.7}s`,
  duration: `${7 + (index % 6)}s`,
}));

export function EmberField() {
  return (
    <div className="ember-field" aria-hidden="true">
      {embers.map((ember) => (
        <span
          key={ember.id}
          style={
            {
              "--ember-x": ember.x,
              "--ember-y": ember.y,
              "--ember-delay": ember.delay,
              "--ember-duration": ember.duration,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

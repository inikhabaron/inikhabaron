'use client';

export default function BookmarkSkeleton() {
  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '40px auto',
        padding: '0 20px',
      }}
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          style={{
            display: 'flex',
            gap: 20,
            marginBottom: 24,
            padding: 20,
            borderRadius: 18,
            border: '1px solid #E5E7EB',
            background: '#fff',
          }}
        >
          <div
            className="loader-skeleton"
            style={{
              width: 220,
              height: 140,
              borderRadius: 14,
            }}
          />

          <div
            style={{
              flex: 1,
            }}
          >
            <div
              className="loader-skeleton"
              style={{
                width: 90,
                height: 18,
                marginBottom: 16,
                borderRadius: 8,
              }}
            />

            <div
              className="loader-skeleton"
              style={{
                width: '85%',
                height: 22,
                marginBottom: 14,
                borderRadius: 8,
              }}
            />

            <div
              className="loader-skeleton"
              style={{
                width: '100%',
                height: 14,
                marginBottom: 10,
                borderRadius: 8,
              }}
            />

            <div
              className="loader-skeleton"
              style={{
                width: '92%',
                height: 14,
                marginBottom: 22,
                borderRadius: 8,
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: 12,
              }}
            >
              <div
                className="loader-skeleton"
                style={{
                  width: 90,
                  height: 14,
                  borderRadius: 8,
                }}
              />

              <div
                className="loader-skeleton"
                style={{
                  width: 120,
                  height: 14,
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
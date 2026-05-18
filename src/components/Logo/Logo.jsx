export default function Logo({ className = "", style = {} }) {
    return (
        <div className={`logo ${className}`} style={{ display: 'flex', alignItems: 'center', height: '40px', ...style }}>
            <img
                src={`/images/logo.png?v=${Date.now()}`}
                alt="VANCAR AUTOS LIMITED"
                style={{
                    height: '100%',
                    width: 'auto',
                    objectFit: 'contain',
                }}
            />
        </div>
    );
}

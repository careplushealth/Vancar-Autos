import './FilterPills.css';

export default function FilterPills({ options, selected, onChange, label }) {
    return (
        <div className="filter-pills">
            {label && <span className="filter-pills__label">{label}</span>}
            <div className="filter-pills__list">
                {options.map(option => (
                    <button
                        key={option}
                        className={`filter-pills__pill ${selected === option ? 'filter-pills__pill--active' : ''}`}
                        onClick={() => onChange(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

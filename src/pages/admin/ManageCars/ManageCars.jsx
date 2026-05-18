import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCars, deleteCar, updateCar } from '../../../services/dataService';
import './ManageCars.css';

export default function ManageCars() {
    const [refresh, setRefresh] = useState(0);
    const cars = useMemo(() => getCars(), [refresh]);

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this car?')) {
            deleteCar(id);
            setRefresh(prev => prev + 1);
        }
    };

    const handleToggleStatus = (car) => {
        const newStatus = car.status === 'sold' ? 'available' : 'sold';
        updateCar(car.id, { status: newStatus });
        setRefresh(prev => prev + 1);
    };

    return (
        <div className="manage-cars">
            <div className="manage-cars__header">
                <h1>Manage Inventory</h1>
                <Link to="/admin/cars/new" className="btn btn--primary">+ Add Car</Link>
            </div>

            <div className="manage-cars__table-container">
                <table className="manage-cars__table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Vehicle</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map(car => (
                            <tr key={car.id}>
                                <td>
                                    <img src={car.images?.[0] || '/images/car-sedan.png'} alt="" className="manage-cars__thumb" />
                                </td>
                                <td>
                                    <div className="manage-cars__info">
                                        <span className="manage-cars__title">{car.year} {car.make} {car.model}</span>
                                        <span className="manage-cars__subtitle">{car.trim}</span>
                                    </div>
                                </td>
                                <td>£{car.price.toLocaleString()}</td>
                                <td>
                                    <span className={`manage-cars__status manage-cars__status--${car.status}`}>
                                        {car.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="manage-cars__actions">
                                        <button 
                                            onClick={() => handleToggleStatus(car)} 
                                            className={`btn btn--sm ${car.status === 'sold' ? 'btn--primary' : 'btn--outline'}`}
                                            style={{ marginRight: '8px' }}
                                        >
                                            {car.status === 'sold' ? 'Mark Available' : 'Mark Sold'}
                                        </button>
                                        <Link to={`/admin/cars/${car.id}/edit`} className="btn btn--sm btn--secondary">Edit</Link>
                                        <button onClick={() => handleDelete(car.id)} className="btn btn--sm btn--outline manage-cars__delete">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

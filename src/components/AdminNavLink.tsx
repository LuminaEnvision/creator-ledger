import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../lib/admin';

export const AdminNavLink: React.FC = () => {
    const { user } = useAuth();
    const userIsAdmin = isAdmin(user?.walletAddress);

    // Only show admin link if user is an admin
    if (!userIsAdmin) {
        return null;
    }

    return (
        <Link to="/admin" className="text-muted-foreground hover:text-primary transition-colors relative group">
            Admin
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full"></span>
        </Link>
    );
};


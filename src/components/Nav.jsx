import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm ${
    isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

export default function Nav() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-4xl p-4 flex items-center gap-2">
        <div className="font-semibold">You found it!</div>
        <nav className="ml-auto flex gap-2">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/blog" className={linkClass}>
            Blog
          </NavLink>
          <NavLink to="/books" className={linkClass}>
            Books
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

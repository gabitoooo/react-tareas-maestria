import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import "./assets/styles/Tasks.css";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

const API_URL = "https://tareasnode.onrender.com/api";
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("192.168.");
const Register = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, { nombre, email, password });
      setMessage("Registro exitoso. Ahora puedes iniciar sesión.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Registro</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="form-control mb-2"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-control mb-2"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="form-control mb-2"
      />
      <button onClick={handleRegister} className="btn btn-primary">
        Registrarse
      </button>
      <p>{message}</p>
      <Link to="/">Ir al Login</Link>
    </div>
  );
};
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      console.log(response);
      Cookies.set("token", response.data.token, {
        expires: 1,
        secure: !isLocal,
        sameSite: "Strict",
      });
      navigate("/tasks");
    } catch (error) {
      setMessage("Credenciales incorrectas");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-control mb-2"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="form-control mb-2"
      />
      <button onClick={handleLogin} className="btn btn-primary">
        Iniciar Sesión
      </button>
      <p>{message}</p>
      <Link to="/register">Registrarse</Link>
    </div>
  );
};

const handleErrors = (error) => {
  let errorResponse = error.response;
  console.log(error.response);
  if (errorResponse.status == 422) {
    let data = errorResponse.data.errors;
    data = data.map((item) => item.msg);
    Swal.fire({
      icon: "error",
      text: JSON.stringify(data),
    });
    return {};
  }
  if (errorResponse.status == 403) {
    Swal.fire({
      icon: "error",
      text: errorResponse.data,
    });
    return {};
  }
  if (errorResponse.status == 401) {
    Swal.fire({
      icon: "error",
      text: "No autorizado para realizar esta accion",
    });
    return false;
  }
  if (errorResponse.status == 419) {
    Swal.fire({
      icon: "error",
      text: "Su session expiro por inactividad, vuelva a iniciar sesion",
    }).then(() => {
      location.reload();
    });
    return {};
  }
  Swal.fire({
    icon: "error",
    text: "Error inesperado recargue la pagina(presione F5), se recargara la pagina",
  }).then(() => {
    //location.reload();
  });
  return {};
};
const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("TODAS");
  const [filterSearch, setfilterSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newFecha, setNewFecha] = useState("");
  const [tareaSelect, setNewTareaSelect] = useState("");
  const token = Cookies.get("token");

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Error cargando tareas", error);
    }
  };
  useEffect(() => {
    fetchTasks();
  }, [token]);

  const addTask = async () => {
    if (newTitulo.trim()) {
      const task = {
        titulo: newTitulo,
        descripcion: newDescripcion,
        fechaLimite: newFecha,
      };
      const response = await axios.post(`${API_URL}/tasks`, task, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks([...tasks, response.data.task]);
      setNewTitulo("");
      setNewDescripcion("");
      setNewFecha("");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterSearch) {      
      return filterSearch
        ? task.titulo.toLowerCase().includes(filterSearch.toLowerCase()) ||
            task.descripcion.toLowerCase().includes(filterSearch.toLowerCase())
        : true;
    }
    return filter === "TODAS" || task.estado === filter;
  });

  const changeStatus = async (id, estado) => {
    try {
      // Enviar la actualización de estado al servidor
      let data = {
        estado,
      };
      await updateTask(id, data);
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
    }
  };

  const updateTask = async (id, data) => {
    try {
      await axios.put(`${API_URL}/tasks/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (error) {
      handleErrors(error);
    }
  };
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (error) {
      handleErrors(error);
    }
  };
  const handleModalUpdate = async (task) => {
    setNewTareaSelect(task);
  };

  const handleUpdate = async () => {
    console.log(tareaSelect);
    await updateTask(tareaSelect.id, tareaSelect);
  };

  return (
    <div className="task-manager">
      <div className="background"></div>
      <div className="header d-flex justify-content-between align-items-center">
        <input
          type="text"
          className="date-selector"
          placeholder="Buscar tarea..."
          value={filterSearch}
          onChange={(e) => setfilterSearch(e.target.value)} // Actualiza el estado con el valor del input
        />

        <select
          className="status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="TODAS">TODAS</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="PROGRESO">PROGRESO</option>
          <option value="COMPLETADA">COMPLETADA</option>
        </select>
      </div>
      <ul className="task-list">
        {filteredTasks.map((task) => (
          <li key={task.id} className="task-item-container">
            <div className="task-item">
              <span>{task.titulo}</span>
              <span className="task-item-fecha">
                {task.fechaLimite
                  ? new Date(task.fechaLimite).toISOString().split("T")[0]
                  : ""}
              </span>
              <span className="task-item-description">{task.descripcion}</span>
            </div>
            <div className="buttons-container">
              <span className="status-badge">
                <select
                  value={task.estado}
                  className="status-badge-select"
                  onChange={(e) => changeStatus(task.id, e.target.value)}
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="PROGRESO">PROGRESO</option>
                  <option value="COMPLETADA">COMPLETADA</option>
                </select>
              </span>
              <div class="dropdown">
                <button
                  class="btn btn-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  ...
                </button>
                <ul class="dropdown-menu">
                  <li>
                    <a
                      class="dropdown-item"
                      href="#"
                      data-bs-toggle="modal"
                      data-bs-target="#exampleModal"
                      onClick={() => handleModalUpdate(task)}
                    >
                      actualizar
                    </a>
                  </li>
                  <li>
                    <a
                      class="dropdown-item"
                      href="#"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      eliminar
                    </a>
                  </li>
                  <li></li>
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="task-input-container fixed-bottom">
        <input
          type="text"
          className="task-input"
          placeholder="Titulo Tarea"
          value={newTitulo}
          onChange={(e) => setNewTitulo(e.target.value)}
        />
        <input
          type="text"
          className="task-input"
          placeholder="Descripcion"
          value={newDescripcion}
          onChange={(e) => setNewDescripcion(e.target.value)}
        />
        <input
          type="date"
          className="task-input"
          placeholder="Agregar una tarea"
          value={newFecha}
          onChange={(e) => setNewFecha(e.target.value)}
        />
        <button className="task-button" onClick={addTask}>
          Agregar
        </button>
      </div>

      <div
        class="modal fade"
        id="exampleModal"
        tabindex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="exampleModalLabel">
                Actualizar Tarea
              </h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Titulo:</label>
                <input
                  class="form-control"
                  type="text"
                  value={tareaSelect.titulo}
                  onChange={(e) =>
                    setNewTareaSelect({
                      ...tareaSelect,
                      titulo: e.target.value,
                    })
                  }
                />
              </div>
              <div class="form-group">
                <label>descripcion:</label>
                <input
                  class="form-control"
                  type="text"
                  value={tareaSelect.descripcion}
                  onChange={(e) =>
                    setNewTareaSelect({
                      ...tareaSelect,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>
              <div class="form-group">
                <label>fecha limite:</label>
                <input
                  class="form-control"
                  type="date"
                  onChange={(e) =>
                    setNewTareaSelect({
                      ...tareaSelect,
                      fechaLimite: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleUpdate()}
                class="btn btn-primary"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tasks" element={<TaskManager />} />
      </Routes>
    </Router>
  );
};

export default App;

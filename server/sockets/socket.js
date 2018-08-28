const { io } = require('../server');

const { Usuarios } = require('../classes/usuario');
const { crearMensaje } = require('../utils/utilidades');
const usuarios = new Usuarios();


io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {

        if (!data.nombre || !data.sala) {
            return callback({
                err: true,
                mensaje: 'El nombre y la sala son necesarios'
            })
        }

        client.join(data.sala);

        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala)

        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala))

        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje(data.nombre, "Entró en el chat"));

        callback(usuarios.getPersonasPorSala(data.sala));

    })


    client.on('crearMensaje', (data) => {

        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
    })

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);

        let mensaje = crearMensaje("Admin", `${personaBorrada.nombre} abandonó el chat`);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', mensaje)

        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala))

    })

    client.on('mensajePrivado', (data) => {
        let emisor = usuarios.getPersona(client.id);
        let destinatario = usuarios.getNombre(data.para);

        let mensaje = crearMensaje(emisor.nombre, data.mensaje);
        client.broadcast.to(destinatario.id).emit('mensajePrivado', mensaje);
    })
});
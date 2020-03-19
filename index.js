
export default class Renderer {
    constructor({ context, vertex, fragment }) {
        /** Properties */
        this.context = context

        /** Shaders */
        this.vertex = this.createShader(this.context.VERTEX_SHADER, vertex)
        this.fragment = this.createShader(this.context.FRAGMENT_SHADER, fragment)

        /** Program */
        this.program = this.createProgram()

        /** Uniforms */
        this.uniforms = this.createVariables(this.context.ACTIVE_UNIFORMS, 'Uniform')

        /** Attributes */
        this.attributes = this.createVariables(this.context.ACTIVE_ATTRIBUTES, 'Attrib')

        /** Usage */
        this.context.useProgram(this.program)
    }

    buffer({
        target = this.context.ARRAY_BUFFER,
        style = this.context.STATIC_DRAW,
        array
    }) {
        /** Create the Buffer */
        const vertexBuffer = this.context.createBuffer()

        /** Bind the Buffer to Global Target Variable */
        this.context.bindBuffer(target, vertexBuffer)

        /** Write Array into Buffer Object with Specified Draw Style */
        this.context.bufferData(target, array, style)

        /** Return Buffer Info */
        return { data: vertexBuffer, style, target }
    }

    draw({ mode, count }) {
        /** Clear Canvas */
        this.context.clear(this.context.COLOR_BUFFER_BIT)

        /** Enable Depth Testing */
        this.context.enable(this.context.DEPTH_TEST)

        /** Draw the Vertices */
        this.context.drawArrays(mode, 0, count)
    }

    animate(callback) {
        requestAnimationFrame(function animator(time) {
            callback(time)

            requestAnimationFrame(animator)
        })
    }

    createVariables(type, identifier) {
        const variables = {}

        const variableCount = this.context.getProgramParameter(this.program, type)

        for (var i = 0; i < variableCount; i++) {
            const getVariable = this[`create${identifier}`]
            const getVariableInfo = this.context[`getActive${identifier}`]
            const getVariableLocation = this.context[`get${identifier}Location`]

            const info = getVariableInfo.call(this.context, this.program, i)
            const location = getVariableLocation.call(this.context, this.program, info.name)

            this[info.name] = getVariable.call(this, info.type, location)
            variables[info.name] = Object.assign(info, { location })
        }

        return variables
    }

    createUniform(type, location) {
        /** Matrices */
        if (type === this.context.FLOAT_MAT2)
            return (function (array) { this.context.uniformMatrix2fv(location, false, array) }).bind(this)

        if (type === this.context.FLOAT_MAT3)
            return (function (array) { this.context.uniformMatrix3fv(location, false, array) }).bind(this)

        if (type === this.context.FLOAT_MAT4)
            return (function (array) { this.context.uniformMatrix4fv(location, false, array) }).bind(this)

        /** Scalars */
        if (type === this.context.FLOAT)
            return (function (float) { this.context.uniform1f(location, float) }).bind(this)
    }

    createAttrib(_, location) {
        return (function ({
            buffer,
            size,
            type = this.context.FLOAT,
            offset = 0,
            stride = 0,
        }) {
            this.context.bindBuffer(buffer.target, buffer.data)
            this.context.enableVertexAttribArray(location)
            this.context.vertexAttribPointer(location, size, type, false, stride, offset)
        }).bind(this)
    }

    createShader(type, source) {
        const shader = this.context.createShader(type)

        this.context.shaderSource(shader, source)
        this.context.compileShader(shader)

        const didCompile = this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)

        if (!didCompile) {
            console.error(`Error with compile: ${this.context.getShaderInfoLog(shader)}`)
            this.context.deleteShader(shader)

            return null
        }

        return shader
    }

    createProgram() {
        const program = this.context.createProgram()

        this.context.attachShader(program, this.vertex)
        this.context.attachShader(program, this.fragment)

        this.context.linkProgram(program)

        const didLink = this.context.getProgramParameter(program, this.context.LINK_STATUS)

        if (!didLink) {
            console.error(`Error with link: ${this.context.getProgramInfoLog(program)}`)
            this.context.deleteProgram(program)

            return null
        }

        return program
    }
}

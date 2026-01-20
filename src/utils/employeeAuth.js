/**
 * Utilidades para autenticación de empleados
 */

import { supabase } from '../services/api/supabaseClient';

/**
 * Buscar empleado por código o teléfono + PIN
 * @param {string} codigo - Código del empleado, teléfono + PIN (formato: telefono|PIN), o solo teléfono
 * @returns {Promise<Object|null>} - Datos del empleado o null si no existe
 */
export const findEmployeeByCode = async (codigo) => {
  try {
    // Si el código contiene "|", es teléfono + PIN
    if (codigo.includes('|')) {
      const [telefono, pin] = codigo.split('|');
      const telefonoLimpio = telefono.replace(/\D/g, ''); // Solo números
      
      // Buscar por código completo que coincida exactamente
      const { data, error } = await supabase
        .from('team_members')
        .select('*, organizations(*)')
        .eq('employee_code', codigo)
        .eq('is_employee', true)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Si no se encuentra por código exacto, buscar por teléfono y PIN
          const { data: phoneData, error: phoneError } = await supabase
            .from('team_members')
            .select('*, organizations(*)')
            .eq('is_employee', true)
            .eq('status', 'active')
            .or(`employee_phone.ilike.%${telefonoLimpio}%,employee_phone.ilike.%${telefono}%`)
            .like('employee_code', `%|${pin}`)
            .single();

          if (phoneError) {
            if (phoneError.code === 'PGRST116') {
              return null;
            }
            throw phoneError;
          }

          // Verificar que el código completo coincida
          if (phoneData && phoneData.employee_code === codigo) {
            return phoneData;
          }
          return null;
        }
        throw error;
      }

      return data;
    } else {
      // Primero buscar por código corto directo
      const { data, error } = await supabase
        .from('team_members')
        .select('*, organizations(*)')
        .eq('employee_code', codigo)
        .eq('is_employee', true)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        return data;
      }

      // Si no se encuentra por código, y el input parece ser un número largo (teléfono)
      // buscar por teléfono (sin PIN)
      if (error && error.code === 'PGRST116' && /^\d+$/.test(codigo) && codigo.length >= 7) {
        // Buscar empleados con teléfono que coincida
        const { data: phoneData, error: phoneError } = await supabase
          .from('team_members')
          .select('*, organizations(*)')
          .eq('is_employee', true)
          .eq('status', 'active')
          .or(`employee_phone.ilike.%${codigo}%`)
          .limit(1);

        if (!phoneError && phoneData && phoneData.length > 0) {
          // Si hay múltiples coincidencias, devolver la primera
          // El usuario deberá usar teléfono|PIN para ser más específico
          return phoneData[0];
        }
      }

      if (error && error.code === 'PGRST116') {
        return null;
      }

      if (error) {
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Error buscando empleado:', error);
    return null;
  }
};

/**
 * Crear usuario en Auth para empleado y hacer login
 * @param {Object} employee - Datos del empleado
 * @param {string} codigo - Código del empleado
 * @returns {Promise<Object>} - { success: boolean, user?: Object, error?: string, needsPassword?: boolean }
 */
const createEmployeeAuthAndLogin = async (employee, codigo) => {
  try {
    // Crear el email del empleado: {codigo}@empleado.creceplus.local
    const employeeEmail = `${codigo}@empleado.creceplus.local`;
    const employeePassword = codigo; // Usar el código como contraseña inicial
    
    // Intentar crear el usuario usando signUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: employeeEmail,
      password: employeePassword,
      options: {
        data: {
          full_name: employee.employee_name,
          phone: employee.employee_phone || null,
          is_employee: true,
          employee_code: codigo
        }
      }
    });

    if (signUpError) {
      // Si el usuario ya existe, intentar login
      if (signUpError.message.includes('already registered') || 
          signUpError.message.includes('User already registered') ||
          signUpError.message.includes('already exists')) {
        
        // Intentar login con el código como contraseña
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: employeeEmail,
          password: employeePassword
        });

        if (loginError) {
          // Si falla el login, puede ser que la contraseña fue cambiada
          return {
            success: false,
            error: 'Este código requiere contraseña. Por favor ingresa tu contraseña.',
            needsPassword: true
          };
        }

        // Actualizar team_members con el user_id si no lo tiene
        if (!employee.user_id && loginData.user) {
          await supabase
            .from('team_members')
            .update({ user_id: loginData.user.id })
            .eq('id', employee.id);
        }

        return {
          success: true,
          user: loginData.user,
          employee: { ...employee, user_id: loginData.user.id }
        };
      }
      
      return {
        success: false,
        error: 'Error al crear acceso para empleado. Contacta al administrador.'
      };
    }

    if (signUpData.user) {
      // Actualizar team_members con el user_id
      await supabase
        .from('team_members')
        .update({ user_id: signUpData.user.id })
        .eq('id', employee.id);

      // Verificar si hay sesión activa
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        return {
          success: true,
          user: signUpData.user,
          employee: { ...employee, user_id: signUpData.user.id }
        };
      } else {
        // Si no hay sesión, hacer login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: employeeEmail,
          password: employeePassword
        });

        if (loginError) {
          return {
            success: false,
            error: 'Error al iniciar sesión. Por favor intenta nuevamente.'
          };
        }

        return {
          success: true,
          user: loginData.user,
          employee: { ...employee, user_id: signUpData.user.id }
        };
      }
    }

    return {
      success: false,
      error: 'Error al crear acceso para empleado'
    };
  } catch (error) {
    console.error('Error creando auth para empleado:', error);
    return {
      success: false,
      error: 'Error al crear acceso para empleado. Contacta al administrador.'
    };
  }
};

/**
 * Autenticar empleado usando código
 * @param {string} codigo - Código del empleado
 * @returns {Promise<Object>} - { success: boolean, user?: Object, error?: string, needsPassword?: boolean }
 */
export const loginEmployee = async (codigo) => {
  try {
    // Buscar el empleado por código
    const employee = await findEmployeeByCode(codigo);

    if (!employee) {
      return {
        success: false,
        error: 'Código de empleado no válido o no encontrado'
      };
    }

    // Si el empleado tiene user_id, intentar login con el email generado
    if (employee.user_id) {
      // El email es: {codigo}@empleado.creceplus.local
      const employeeEmail = `${codigo}@empleado.creceplus.local`;
      
      // Intentar login con el código como contraseña
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: employeeEmail,
        password: codigo // La contraseña inicial es el código
      });

      if (authError) {
        // Si falla, puede ser que la contraseña fue cambiada
        return {
          success: false,
          error: 'Este código requiere contraseña. Por favor ingresa tu contraseña.',
          needsPassword: true // Indicar que necesita contraseña
        };
      }

      return {
        success: true,
        user: authData.user,
        employee: employee
      };
    } else {
      // Empleado sin user_id - crear usuario en Auth automáticamente
      return await createEmployeeAuthAndLogin(employee, codigo);
    }
  } catch (error) {
    console.error('Error en login de empleado:', error);
    return {
      success: false,
      error: error.message || 'Error al autenticar empleado'
    };
  }
};

/**
 * Autenticar empleado con código y contraseña
 * @param {string} codigo - Código del empleado
 * @param {string} password - Contraseña del empleado
 * @returns {Promise<Object>} - { success: boolean, user?: Object, error?: string }
 */
export const loginEmployeeWithPassword = async (codigo, password) => {
  try {
    // Buscar el empleado por código
    const employee = await findEmployeeByCode(codigo);

    if (!employee) {
      return {
        success: false,
        error: 'Código de empleado no válido'
      };
    }

    if (!employee.user_id) {
      // Si no tiene user_id, intentar crear el usuario primero
      const createResult = await createEmployeeAuthAndLogin(employee, codigo);
      if (!createResult.success) {
        return createResult;
      }
      // Si se creó exitosamente, intentar login con contraseña
      employee.user_id = createResult.user.id;
    }

    // El email es: {codigo}@empleado.creceplus.local
    const employeeEmail = `${codigo}@empleado.creceplus.local`;
    
    // Intentar login con email y contraseña
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: employeeEmail,
      password: password
    });

    if (authError) {
      return {
        success: false,
        error: 'Código o contraseña incorrectos'
      };
    }

    return {
      success: true,
      user: authData.user,
      employee: employee
    };
  } catch (error) {
    console.error('Error en login de empleado:', error);
    return {
      success: false,
      error: error.message || 'Error al autenticar empleado'
    };
  }
};

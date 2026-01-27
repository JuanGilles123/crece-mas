/**
 * Utilidades para autenticación de empleados
 */

import { supabase } from '../services/api/supabaseClient';

/**
 * Buscar empleado por email
 * @param {string} email - Email del empleado
 * @returns {Promise<Object|null>} - Datos del empleado o null si no existe
 */
export const findEmployeeByEmail = async (email) => {
  try {
    const emailLower = email.toLowerCase().trim();
    
    // Buscar empleados: pueden tener is_employee=true (sin user_id) o is_employee=false (con user_id)
    // Identificamos empleados por tener employee_email, employee_name, employee_code, etc.
    // Primero buscar por employee_email directamente
    const { data, error } = await supabase
      .from('team_members')
      .select('*, organizations(*)')
      .eq('employee_email', emailLower)
      .eq('status', 'active')
      .not('employee_email', 'is', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Si no se encuentra por employee_email, puede ser que el email usado en Auth
        // sea diferente del employee_email guardado (empleados creados antes del fix)
        // Intentar buscar empleados con user_id y verificar si el email coincide
        // mediante un intento de login (pero esto requiere la contraseña)
        // 
        // Alternativa: buscar todos los empleados activos con user_id y employee_email null o diferente
        // y verificar manualmente. Pero como no podemos acceder a Auth desde el cliente,
        // la mejor opción es intentar hacer login directamente con el email proporcionado
        // si el empleado tiene user_id.
        //
        // Por ahora, simplemente retornamos null y el usuario deberá usar el mismo email
        // que se usó al crear el empleado, o contactar al administrador para actualizar
        // el employee_email.
        console.warn(`Empleado no encontrado por employee_email: ${emailLower}. Si el empleado fue creado antes del fix, puede que necesite actualizar su employee_email.`);
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error buscando empleado por email:', error);
    return null;
  }
};

/**
 * Buscar empleado por teléfono
 * @param {string} telefono - Teléfono del empleado
 * @returns {Promise<Object|null>} - Datos del empleado o null si no existe
 */
export const findEmployeeByPhone = async (telefono) => {
  try {
    const telefonoLimpio = telefono.replace(/\D/g, ''); // Solo números
    
    // Buscar empleados por teléfono (pueden tener is_employee=true o false)
    // Identificamos empleados por tener employee_phone
    const { data, error } = await supabase
      .from('team_members')
      .select('*, organizations(*)')
      .eq('status', 'active')
      .not('employee_phone', 'is', null)
      .or(`employee_phone.ilike.%${telefonoLimpio}%,employee_phone.ilike.%${telefono}%`)
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error('Error buscando empleado por teléfono:', error);
    return null;
  }
};

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
 * Generar contraseña segura inicial
 * @returns {string} - Contraseña de 8 caracteres con mayúsculas, minúsculas y números
 */
const generateSecurePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  // Asegurar al menos una mayúscula, una minúscula y un número
  password += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)];
  password += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 24)];
  password += '23456789'[Math.floor(Math.random() * 8)];
  // Completar con caracteres aleatorios
  for (let i = password.length; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Crear usuario en Auth para empleado y hacer login
 * @param {Object} employee - Datos del empleado
 * @param {string} identifier - Email, teléfono o código del empleado
 * @param {string} password - Contraseña para el empleado
 * @returns {Promise<Object>} - { success: boolean, user?: Object, error?: string, needsPassword?: boolean }
 */
const createEmployeeAuthAndLogin = async (employee, identifier, password) => {
  try {
    // Determinar el email a usar
    let employeeEmail;
    if (employee.employee_email) {
      // Si tiene email, usarlo directamente
      employeeEmail = employee.employee_email.toLowerCase().trim();
    } else if (employee.employee_phone) {
      // Si no tiene email pero tiene teléfono, crear email con teléfono
      const telefonoLimpio = employee.employee_phone.replace(/\D/g, '');
      employeeEmail = `${telefonoLimpio}@empleado.creceplus.local`;
    } else {
      // Si no tiene ni email ni teléfono, usar código como fallback
      employeeEmail = `${identifier}@empleado.creceplus.local`;
    }
    
    const employeePassword = password || generateSecurePassword();
    
    // Intentar crear el usuario usando signUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: employeeEmail,
      password: employeePassword,
      options: {
        data: {
          full_name: employee.employee_name,
          phone: employee.employee_phone || null,
          is_employee: true,
          employee_code: employee.employee_code || identifier
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

        // Verificar si necesita cambiar contraseña
        const needsPasswordChange = loginData.user?.user_metadata?.needs_password_change === true;

        return {
          success: true,
          user: loginData.user,
          employee: { ...employee, user_id: loginData.user.id },
          needsPasswordChange: needsPasswordChange
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
        // Verificar si necesita cambiar contraseña
        const needsPasswordChange = signUpData.user?.user_metadata?.needs_password_change === true;
        
        return {
          success: true,
          user: signUpData.user,
          employee: { ...employee, user_id: signUpData.user.id },
          needsPasswordChange: needsPasswordChange
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

        // Verificar si necesita cambiar contraseña
        const needsPasswordChange = loginData.user?.user_metadata?.needs_password_change === true;

        return {
          success: true,
          user: loginData.user,
          employee: { ...employee, user_id: signUpData.user.id },
          needsPasswordChange: needsPasswordChange
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
 * Autenticar empleado usando email/teléfono y contraseña
 * @param {string} identifier - Email o teléfono del empleado
 * @param {string} password - Contraseña del empleado
 * @returns {Promise<Object>} - { success: boolean, user?: Object, error?: string, needsPasswordChange?: boolean }
 */
export const loginEmployee = async (identifier, password) => {
  try {
    // Determinar si es email o teléfono
    const isEmail = identifier.includes('@');
    let employee;
    
    // PRIMERO: Si es email y tenemos contraseña, intentar login directo con Auth
    // Esto es más confiable porque el email en Auth puede ser diferente al employee_email
    if (isEmail && password) {
      const identifierLower = identifier.toLowerCase().trim();
      
      // Intentar login directo con el email proporcionado
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifierLower,
        password: password
      });

      if (!authError && authData?.user) {
        // Login exitoso, buscar empleado por user_id
        const { data: employeeData, error: employeeError } = await supabase
          .from('team_members')
          .select('*, organizations(*)')
          .eq('user_id', authData.user.id)
          .eq('status', 'active')
          .single();

        if (!employeeError && employeeData) {
          // Actualizar employee_email si no coincide
          if (employeeData.employee_email !== identifierLower) {
            await supabase
              .from('team_members')
              .update({ employee_email: identifierLower })
              .eq('id', employeeData.id);
            employeeData.employee_email = identifierLower;
          }

          // Verificar si necesita cambiar contraseña
          const needsPasswordChange = authData.user?.user_metadata?.needs_password_change === true;

          return {
            success: true,
            user: authData.user,
            employee: employeeData,
            needsPasswordChange: needsPasswordChange
          };
        } else if (employeeError) {
          // El usuario existe en Auth pero no en team_members
          console.error('Usuario encontrado en Auth pero no en team_members:', employeeError);
          return {
            success: false,
            error: 'El usuario no está asociado a ningún empleado. Contacta al administrador.'
          };
        }
      } else if (authError) {
        // El login directo falló, guardar el error para referencia pero continuar con búsqueda
        console.log('Login directo falló, intentando búsqueda en team_members:', authError.message);
      }
    }
    
    // SEGUNDO: Buscar empleado en team_members
    if (isEmail) {
      // Buscar por email
      employee = await findEmployeeByEmail(identifier);
    } else {
      // Buscar por teléfono
      employee = await findEmployeeByPhone(identifier);
      
      // Si no se encuentra por teléfono, intentar por código (compatibilidad)
      if (!employee) {
        employee = await findEmployeeByCode(identifier);
      }
    }

    if (!employee) {
      return {
        success: false,
        error: isEmail 
          ? 'Email no encontrado. Verifica que esté correcto.'
          : 'Teléfono o código no encontrado. Verifica que esté correcto.'
      };
    }

    // Determinar el email a usar para autenticación
    let employeeEmail;
    if (employee.employee_email) {
      employeeEmail = employee.employee_email.toLowerCase().trim();
    } else if (employee.employee_phone) {
      const telefonoLimpio = employee.employee_phone.replace(/\D/g, '');
      employeeEmail = `${telefonoLimpio}@empleado.creceplus.local`;
    } else {
      // Fallback al código
      employeeEmail = `${employee.employee_code}@empleado.creceplus.local`;
    }

    // Si el empleado tiene user_id, intentar login
    if (employee.user_id) {
      if (!password) {
        return {
          success: false,
          error: 'Por favor ingresa tu contraseña.',
          needsPassword: true
        };
      }
      
      // Si el email ingresado es diferente al employee_email, intentar primero con el ingresado
      const identifierLower = isEmail ? identifier.toLowerCase().trim() : null;
      let authData = null;
      let authError = null;
      
      // Intentar con ambos emails si son diferentes
      const emailsToTry = [];
      if (identifierLower && identifierLower !== employeeEmail) {
        emailsToTry.push(identifierLower);
      }
      emailsToTry.push(employeeEmail);
      
      // Intentar login con cada email hasta que uno funcione
      for (const emailToTry of emailsToTry) {
        const result = await supabase.auth.signInWithPassword({
          email: emailToTry,
          password: password
        });
        
        if (!result.error && result.data?.user) {
          authData = result.data;
          authError = null;
          // Si el email que funcionó es diferente al employee_email, actualizarlo
          if (emailToTry !== employeeEmail) {
            await supabase
              .from('team_members')
              .update({ employee_email: emailToTry })
              .eq('id', employee.id);
            employee.employee_email = emailToTry;
          }
          break;
        } else {
          authError = result.error;
        }
      }

      if (authError) {
        // Proporcionar un mensaje de error más específico
        const errorMessage = authError.message || '';
        const errorLower = errorMessage.toLowerCase();
        
        console.error('Error de autenticación:', {
          message: errorMessage,
          status: authError.status,
          emailIntentado: identifierLower || employeeEmail,
          employeeEmail: employee.employee_email
        });
        
        if (errorLower.includes('email not confirmed') || 
            errorLower.includes('email_not_confirmed') ||
            errorLower.includes('confirmation')) {
          return {
            success: false,
            error: 'Tu email no ha sido confirmado. Por favor, revisa tu correo y confirma tu cuenta, o contacta al administrador para que active tu cuenta.'
          };
        }
        
        if (errorLower.includes('invalid login') || 
            errorLower.includes('invalid credentials') ||
            errorLower.includes('invalid password') ||
            errorLower.includes('wrong password')) {
          return {
            success: false,
            error: 'Email o contraseña incorrectos. Verifica que estés usando el email y contraseña correctos. Si olvidaste tu contraseña, contacta al administrador.'
          };
        }
        
        if (errorLower.includes('user not found') || 
            errorLower.includes('user_not_found')) {
          return {
            success: false,
            error: 'El email no está registrado. Verifica que estés usando el email correcto o contacta al administrador.'
          };
        }
        
        return {
          success: false,
          error: 'Error al autenticar: ' + (errorMessage || 'Por favor verifica tu contraseña. Si el problema persiste, contacta al administrador.')
        };
      }

      // Verificar si necesita cambiar contraseña
      const needsPasswordChange = authData.user?.user_metadata?.needs_password_change === true;

      return {
        success: true,
        user: authData.user,
        employee: employee,
        needsPasswordChange: needsPasswordChange
      };
    } else {
      // Empleado sin user_id - crear usuario en Auth automáticamente
      // Si no se proporciona contraseña, generar una segura
      const initialPassword = password || generateSecurePassword();
      return await createEmployeeAuthAndLogin(employee, identifier, initialPassword);
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
 * Autenticar empleado con código y contraseña (método legacy para compatibilidad)
 * @param {string} codigo - Código del empleado
 * @param {string} password - Contraseña del empleado
 * @returns {Promise<Object>} - { success: boolean, user?: Object, error?: string }
 */
export const loginEmployeeWithPassword = async (codigo, password) => {
  // Usar la nueva función loginEmployee
  return await loginEmployee(codigo, password);
};

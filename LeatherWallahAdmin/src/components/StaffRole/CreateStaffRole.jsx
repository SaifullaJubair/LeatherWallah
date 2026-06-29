import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { BASE_URL } from '../../utils/baseURL'
import permissionsData from '../../data/permissionData'
import MiniSpinner from '../../shared/MiniSpinner/MiniSpinner'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './../../context/AuthProvider'

const CreateStaffRole = () => {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm()
  // const { user } = useContext(AuthContext);
  // const token = getCookie(authKey);

  // console.log(roleData);

  const [loading, setLoading] = useState(false)
  const { user } = useContext(AuthContext)
  // Watch all fields to apply conditional styles
  const watchAllFields = watch()
  const navigate = useNavigate()
  // Add role permission
  const handleDataPost = async (data) => {
    setLoading(true)
    const sendData = {
      role_publisher_id: user?._id,
      role_name: data?.role_name,
    }

    permissionsData?.forEach((section) => {
      section?.Type?.forEach((permission) => {
        sendData[permission?.type_value] = data[permission?.type_value] || false
      })
    })
    try {
      const response = await fetch(
        `${BASE_URL}/role`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(sendData),
        }
      )
      const result = await response.json()
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || 'Role created successfully', {
          autoClose: 1000,
        })

        setLoading(false)

        reset()
        navigate('/staff-role')
      } else {
        toast.error(result?.message || 'Something went wrong', {
          autoClose: 1000,
        })
      }
    } catch (error) {
      toast.error('Network error or server is down', {
        autoClose: 1000,
      })
      console.log(error)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="">
    <div className="max-w-7xl mx-auto bg-white p-4 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <h3
          className="text-[26px] font-bold text-gray-800 capitalize"
          id="modal-title"
        >
          Role Information
        </h3>
      </div>

      <hr className="mt-2 mb-4" />

      <form onSubmit={handleSubmit(handleDataPost)}>
        <div className="mt-4 max-w-lg">
          <p className="ml-1 text-sm font-semibold py-1 text-gray-700">
            Role Name
          </p>
          <input
            placeholder="Role Name"
            {...register("role_name", { required: "Role Name is required" })}
            id="role_name"
            type="text"
            className="block w-full px-2 py-1.5 outline-primaryVariant-400 text-gray-700 bg-white border border-gray-200 rounded"
          />
          {errors.role_name && (
            <p className="text-red-600">{errors.role_name.message}</p>
          )}
        </div>

        {/* Permissions */}
        <div className="mt-4">
          <h4 className="text-md font-semibold  mb-2">Permissions</h4>
          <div className="">
            {permissionsData?.map((section) => (
              <div key={section?.Name} className="border rounded p-2 mb-4">
                <p className="ml-1 font-semibold py-1 text-gray-700">
                  {section?.Name}
                </p>
                <hr className="mb-2" />
                <div className="flex flex-wrap md:flex-nowrap  md:justify-between items-center lg:gap-6 gap-3 py-2">
                  {section?.Type?.map((permission) => {
                    const isChecked = watchAllFields[permission?.type_value];
                    return (
                      <label
                        key={permission?.type_value}
                        htmlFor={permission?.type_value}
                        className={`flex items-center max-w-lg border shadow cursor-pointer w-full p-2 rounded ${
                          isChecked
                            ? "bg-green-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={permission?.type_value}
                          {...register(permission?.type_value)}
                          className="mr-2 outline-primaryVariant-600"
                        />
                        <span
                          className={`text-sm ${
                            isChecked ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {permission?.type_name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-4">
          {loading ? (
            <button
              type="button"
              className="px-6 py-2 text-white transition-colors duration-300 transform bg-blue-500 rounded-xl hover:bg-blue-400"
            >
              <MiniSpinner />
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2 text-white transition-colors duration-300 transform bg-blue-500 rounded-xl hover:bg-blue-400"
            >
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  </div>
  )
}

export default CreateStaffRole

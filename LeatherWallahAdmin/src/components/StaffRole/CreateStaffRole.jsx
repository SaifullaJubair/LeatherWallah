import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { BASE_URL } from '../../utils/baseURL'
import permissionsData from '../../data/permissionData'
import PermissionSections from './PermissionSections'
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
    setValue,
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

        {/* Permissions — grouped by sidebar section (see PermissionSections) */}
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-1">Permissions</h4>
          <p className="text-xs text-gray-500 mb-3">
            Grouped the same way the sidebar is. Give a staff member the sections
            they work in — &quot;Select all&quot; grants a whole section at once.
          </p>
          <PermissionSections
            register={register}
            watchAllFields={watchAllFields}
            setValue={setValue}
          />
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

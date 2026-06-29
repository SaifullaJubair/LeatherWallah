import { useState } from 'react'
import { useForm } from 'react-hook-form'
import MiniSpinner from './../../shared/MiniSpinner/MiniSpinner'
import { RiImageAddFill } from 'react-icons/ri'
import { RxCross1 } from 'react-icons/rx'
import { BASE_URL } from './../../utils/baseURL'
import { toast } from 'react-toastify'

const UpdateSlider = ({
  setShowSliderUpdateModal,
  getSliderUpdateData,
  refetch,
}) => {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit } = useForm()

  //Image preview....
  const [imagePreview, setImagePreview] = useState(
    getSliderUpdateData?.slider_image
  )

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle Update Slider
  const handleDataPost = async (data) => {
    if (data?.slider_image[0]) {
      setLoading(true)
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'slider_image') {
          formData.append(key, data?.slider_image[0])
        } else formData.append(key, value)
      })

      formData.append('slider_image_key', getSliderUpdateData?.slider_image_key)
      formData.append('_id', getSliderUpdateData?._id)

      const response = await fetch(
        `${BASE_URL}/slider`,
        {
          method: 'PATCH',
          credentials: 'include',
          body: formData,
        }
      )
      const result = await response.json()
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : 'Slider update successfully',
          {
            autoClose: 1000,
          }
        )
        refetch()
        setLoading(false)
        setShowSliderUpdateModal(false)
      } else {
        toast.error(result?.message || 'Something went wrong', {
          autoClose: 1000,
        })
        setLoading(false)
      }
    } else {
      setLoading(true)
      const sendData = {
        _id: getSliderUpdateData?._id,

        slider_serial: data?.slider_serial
          ? data?.slider_serial
          : getSliderUpdateData?.slider_serial,
        slider_path: data?.slider_path
          ? data?.slider_path
          : getSliderUpdateData?.slider_path,

        slider_status: data?.slider_status
          ? data?.slider_status
          : getSliderUpdateData?.slider_status,
        slider_image_key: getSliderUpdateData?.slider_image_key,
      }
      const response = await fetch(
        `${BASE_URL}/slider`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sendData),
        }
      )
      const result = await response.json()
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : 'Slider update successfully',
          {
            autoClose: 1000,
          }
        )
        refetch()
        setLoading(false)
        setShowSliderUpdateModal(false)
      } else {
        toast.error(result?.message || 'Something went wrong', {
          autoClose: 1000,
        })
        setLoading(false)
      }
    }
  }
  return (
    <div>
      <div>
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin'>
            <div className='flex items-center justify-between mt-4'>
              <h3
                className='text-[26px] font-bold text-gray-800 capitalize'
                id='modal-title '
              >
                Update Slider
              </h3>
              <button
                type='button'
                className='btn bg-white   p-1 absolute right-3 rounded-full top-3 hover:bg-bgBtnInactive hover:text-btnInactiveColor'
                onClick={() => setShowSliderUpdateModal(false)}
              >
                {' '}
                <RxCross1 size={20}></RxCross1>
              </button>
            </div>

            <hr className='mt-2 mb-6' />

            <form onSubmit={handleSubmit(handleDataPost)} className=''>
              <div>
                <label
                  htmlFor='UserEmail'
                  className='block text-xs font-medium text-gray-700'
                >
                  Slider Serial
                </label>

                <input
                  {...register('slider_serial', {
                    validate: (value) => {
                      if (value < 1) {
                        return 'serial must be greater than 0'
                      }
                      // else if (value > 100) {
                      //   return 'Serial must be less then 100'
                      // }
                    },
                  })}
                  defaultValue={getSliderUpdateData?.slider_serial}
                  type='number'
                  placeholder='Banner Serial'
                  className='mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2'
                />
              </div>
              <div className='mt-4 grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Slider Status
                  </label>
                  <select
                    {...register('slider_status')}
                    className='mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full'
                    defaultValue={getSliderUpdateData?.slider_status}
                  >
                    <option value='active'>Active</option>
                    <option value='in-active'>In-Active</option>
                  </select>
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Slider Path
                  </label>

                  <input
                    {...register('slider_path')}
                    type='text'
                    defaultValue={getSliderUpdateData?.slider_path}
                    placeholder='Banner Path'
                    className='mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2'
                  />
                </div>
              </div>
              <div className='mt-6'>
                {imagePreview ? (
                  <div className='relative'>
                    <button
                      type='button'
                      className='btn bg-bgBtnInactive border p-1 absolute right-1 rounded-full top-1 text-btnInactiveColor '
                      onClick={() => setImagePreview(false)}
                    >
                      {' '}
                      <RxCross1 size={15}></RxCross1>
                    </button>

                    <img
                      src={imagePreview}
                      alt='Preview'
                      className='w-full h-64 object-cover my-2 rounded '
                    />
                  </div>
                ) : (
                  <label
                    className='mt-4 w-full h-[160px] bg-gray-100 border-dashed border flex justify-center items-center rounded cursor-pointer'
                    htmlFor='slider_image'
                    type='button'
                  >
                    <div className='flex flex-col items-center justify-center '>
                      <div>
                        <RiImageAddFill size={25} />
                      </div>
                      <p className='mt-2 text-[#C9CACA]' type=''>
                        upload image
                      </p>
                    </div>
                  </label>
                )}
                <input
                  {...register('slider_image', {
                    valiDate: {
                      isImage: (value) =>
                        (value[0] && value[0].type.startsWith('image/')) ||
                        'Only image files are allowed',
                    },
                  })}
                  accept='image/*'
                  type='file'
                  id='banner_image'
                  className='mt-2  sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white file:border-none file:rounded file:px-2 file:py-1.5'
                  onChange={handleImageChange}
                />
                <p className='text-xs text-[#C9CACA]  mt-1 text-end'>
                  Upload 300x300 pixel images in PNG, JPG, or WebP format (max 1
                  MB).
                </p>
              </div>

              <div className='flex gap-8 mt-6 justify-end'>
                <button
                  className='px-10 py-2 border rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor'
                  onClick={(event) => {
                    event.preventDefault() // Prevents form submission on Cancel
                    setShowSliderUpdateModal(false)
                  }}
                  type='button'
                >
                  Cancel
                </button>
                {loading == true ? (
                  <div className='px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded'>
                    <MiniSpinner />
                  </div>
                ) : (
                  <button
                    className='px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded'
                    type='submit'
                  >
                    Update
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateSlider

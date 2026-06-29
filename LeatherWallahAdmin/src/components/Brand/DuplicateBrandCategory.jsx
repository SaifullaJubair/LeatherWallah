import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { generateSlug } from '../../utils/generateSlug'
import { RxCross1 } from 'react-icons/rx'

import MiniSpinner from '../../shared/MiniSpinner/MiniSpinner'

import Select from 'react-select'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/baseURL'
import { RiImageAddFill } from 'react-icons/ri'

const DuplicateBrandCategory = ({
  setBrandCategoryDuplicateModal,
  refetch,
  categoryTypes,
  categoryLoading,
  brandUpdateData,
  user,
}) => {
  const [loading, setLoading] = useState(false)
  const [categoryId, setCategory_id] = useState(
    brandUpdateData?.category_id?._id
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  // show Brand image Preview in state

  const [imagePreview, setImagePreview] = useState()

  const handleImageChange = (e) => {
    console.log(12)

    const file = e.target.files[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }
  //

  // Handle Add Category
  const handleDataPost = async (data) => {
    setLoading(true)
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'brand_logo') {
        formData.append(key, data?.brand_logo[0])
      } else formData.append(key, value)
    })

    const brand_slug = generateSlug(data?.brand_name)
    formData.append('brand_slug', brand_slug)
    formData.append('category_id', categoryId)
    formData.append('brand_publisher_id', user?._id)

    const response = await fetch(`${BASE_URL}/brand`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    const result = await response.json()
    if (result?.statusCode === 200 && result?.success === true) {
      toast.success(
        result?.message ? result?.message : 'Brand create successfully',
        {
          autoClose: 1000,
        }
      )
      refetch()
      setLoading(false)
      setBrandCategoryDuplicateModal(false)
    } else {
      toast.error(result?.message || 'Something went wrong', {
        autoClose: 1000,
      })
      setLoading(false)
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
                id='modal-title'
              >
                Duplicate Brand Category
              </h3>
              <button
                type='button'
                className='btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3'
                onClick={() => setBrandCategoryDuplicateModal(false)}
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
                  Brand Category Name <span className='text-red-600'>*</span>
                </label>

                <input
                  {...register('brand_name', {
                    required: 'Brand category name is required',
                  })}
                  type='text'
                  placeholder='Brand Category Name'
                  defaultValue={brandUpdateData?.brand_name}
                  className='mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2'
                />
                {errors.brand_name && (
                  <p className='text-red-600'>{errors.brand_name?.message}</p>
                )}
              </div>

              <div className='mt-4 grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Brand Status <span className='text-red-600'>*</span>
                  </label>
                  <select
                    {...register('brand_status', {
                      required: 'Brand Show Status is required',
                    })}
                    defaultValue={brandUpdateData?.brand_status}
                    className='mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full'
                  >
                    <option value='active'>Active</option>
                    <option value='in-active'>In-Active</option>
                  </select>
                  {errors.brand_status && (
                    <p className='text-red-600'>
                      {errors.brand_status?.message}
                    </p>
                  )}
                </div>
                {/* <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Brand show <span className='text-red-600'>*</span>
                  </label>
                  <div className='whitespace-nowrap px-4 py-2 text-gray-700 '>
                    <label
                      htmlFor='brand3'
                      className='inline-flex items-center space-x-4 cursor-pointer dark:text-gray-800'
                    >
                      <span className='relative mt-2'>
                        <input
                          id='brand3'
                          defaultChecked={brandUpdateData?.brand_show}
                          type='checkbox'
                          className='hidden peer'
                          {...register('brand_show')}
                        />
                        <div className='w-10 h-4 rounded-full shadow bg-slate-200 peer-checked:bg-bgBtnActive '></div>
                        <div className='absolute left-0 w-6 h-6 rounded-full shadow -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primaryColor bg-white'></div>
                      </span>
                    </label>
                  </div>
                </div> */}
                <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Brand Category serial<span className='text-red-600'>*</span>
                  </label>
                  <input
                    {...register('brand_serial', {
                      validate: (value) => {
                        if (value < 1) {
                          return 'serial must be greater than 0'
                        }
                      },
                    })}
                    type='number'
                    placeholder='Brand Serial'
                    className='mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2'
                    defaultValue={brandUpdateData?.brand_serial}
                  />
                  {errors.brand_serial && (
                    <p className='text-red-600'>
                      {errors.brand_serial?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-2'>
                    Category Name
                  </label>
                  {!categoryLoading && (
                    <Select
                      id='category_id'
                      name='category_id'
                      aria-label='Category Type'
                      required
                      defaultValue={{
                        _id: brandUpdateData?.category_id?._id,
                        category_name:
                          brandUpdateData?.category_id?.category_name,
                      }}
                      options={categoryTypes?.data}
                      getOptionLabel={(x) => x?.category_name}
                      getOptionValue={(x) => x?._id}
                      onChange={(selectedOption) =>
                        setCategory_id(selectedOption?._id)
                      }
                    ></Select>
                  )}
                  {errors._id && (
                    <p className='text-red-600'>{errors._id?.message}</p>
                  )}
                </div>
              </div>
              <div className='mt-6 relative'>
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
                    htmlFor='brand_logo'
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
                  {...register('brand_logo', {
                    required: 'Image is Required',
                    valiDate: {
                      isImage: (value) =>
                        (value[0] && value[0].type.startsWith('image/')) ||
                        'Only image files are allowed',
                    },
                  })}
                  accept='image/*'
                  type='file'
                  id='brand_logo'
                  className='mt-1 sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white  file:border-none file:rounded file:px-2 file:py-1.5'
                  onChange={handleImageChange}
                />
                <p className='text-xs text-[#C9CACA]  mt-1 text-end'>
                  Upload 300x300 pixel images in PNG, JPG, or WebP format (max 1
                  MB).
                </p>
                {errors.brand_logo && (
                  <p className='text-red-600'>{errors.brand_logo?.message}</p>
                )}
              </div>
              <div className='flex gap-6 mt-6 justify-end'>
                <button
                  className='px-10 py-2 border rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor'
                  onClick={() => setBrandCategoryDuplicateModal(false)}
                >
                  Cancel
                </button>
                {loading ? (
                  <div className='px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded'>
                    <MiniSpinner />
                  </div>
                ) : (
                  <button
                    className='px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded'
                    type='Submit'
                  >
                    Duplicate
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

export default DuplicateBrandCategory

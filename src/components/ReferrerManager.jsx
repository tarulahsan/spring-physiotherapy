import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Chip,
} from '@material-tailwind/react';
import { FaPlus, FaEdit, FaTrash, FaUserFriends, FaPhone } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { settingsApi } from '../api/settingsApi';
import Modal from './Modal';

const ReferrerManager = () => {
  const [referrers, setReferrers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReferrers();
  }, []);

  const loadReferrers = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getReferrers();
      setReferrers(data || []);
    } catch (error) {
      toast.error('Failed to load referrers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingReferrer) {
        await settingsApi.updateReferrer(editingReferrer.id, formData);
        toast.success('Referrer updated successfully');
      } else {
        await settingsApi.addReferrer(formData);
        toast.success('Referrer added successfully');
      }
      setIsModalOpen(false);
      setEditingReferrer(null);
      setFormData({ name: '', contact: '' });
      loadReferrers();
    } catch (error) {
      toast.error(editingReferrer ? 'Failed to update referrer' : 'Failed to add referrer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (referrer) => {
    setEditingReferrer(referrer);
    setFormData({
      name: referrer.name,
      contact: referrer.contact || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this referrer?')) {
      try {
        setLoading(true);
        await settingsApi.deleteReferrer(id);
        toast.success('Referrer deleted successfully');
        loadReferrers();
      } catch (error) {
        toast.error('Failed to delete referrer');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="m-0 p-6 flex items-center justify-between bg-blue-gray-50 rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <FaUserFriends className="h-8 w-8 text-blue-500" />
          <div>
            <Typography variant="h5" color="blue-gray">
              Referrers
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
              Manage your referrer network
            </Typography>
          </div>
        </div>
        <Button
          className="flex items-center gap-2"
          size="sm"
          onClick={() => {
            setEditingReferrer(null);
            setFormData({ name: '', contact: '' });
            setIsModalOpen(true);
          }}
          disabled={loading}
        >
          <FaPlus className="h-4 w-4" /> Add Referrer
        </Button>
      </CardHeader>
      <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal leading-none opacity-70"
                >
                  Name
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal leading-none opacity-70"
                >
                  Contact
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal leading-none opacity-70"
                >
                  Actions
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {referrers.map((referrer, index) => {
              const isLast = index === referrers.length - 1;
              const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

              return (
                <tr key={referrer.id}>
                  <td className={classes}>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {referrer.name}
                    </Typography>
                  </td>
                  <td className={classes}>
                    {referrer.contact ? (
                      <Chip
                        value={referrer.contact}
                        size="sm"
                        variant="ghost"
                        color="blue-gray"
                        icon={<FaPhone className="h-3 w-3" />}
                      />
                    ) : (
                      <Typography variant="small" className="font-normal text-gray-400 italic">
                        No contact info
                      </Typography>
                    )}
                  </td>
                  <td className={classes}>
                    <div className="flex gap-2">
                      <IconButton
                        variant="text"
                        color="blue"
                        onClick={() => handleEdit(referrer)}
                        disabled={loading}
                      >
                        <FaEdit className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="text"
                        color="red"
                        onClick={() => handleDelete(referrer.id)}
                        disabled={loading}
                      >
                        <FaTrash className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {referrers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center">
                  <Typography variant="small" className="font-normal text-gray-600">
                    No referrers found. Add your first referrer!
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardBody>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReferrer(null);
          setFormData({ name: '', contact: '' });
        }}
        title={editingReferrer ? 'Edit Referrer' : 'Add Referrer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="!border-t-blue-gray-200 focus:!border-blue-500"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />
          </div>
          <div>
            <Input
              type="text"
              label="Contact (Optional)"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="!border-t-blue-gray-200 focus:!border-blue-500"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outlined"
              color="red"
              onClick={() => {
                setIsModalOpen(false);
                setEditingReferrer(null);
                setFormData({ name: '', contact: '' });
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="blue"
              disabled={loading}
            >
              {loading ? 'Processing...' : editingReferrer ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default ReferrerManager;

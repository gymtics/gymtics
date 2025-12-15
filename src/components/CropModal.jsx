import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropUtils';

const CropModal = ({ imageSrc, onCancel, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                position: 'relative',
                width: '90%',
                maxWidth: '500px',
                height: '60%',
                background: '#333',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropCompleteHandler}
                />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '20px', width: '90%', maxWidth: '500px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Zoom</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: '1px solid #666',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--primary)',
                        border: 'none',
                        color: 'var(--bg-dark)',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Set Profile Picture
                </button>
            </div>
        </div>
    );
};

export default CropModal;

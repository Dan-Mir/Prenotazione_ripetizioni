import React, { useState, useEffect } from 'react';

const App = () => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 60,
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const nextStep = () => {
    if (step === 2 && !formData.time) return alert("Seleziona un orario.");
    if (step === 3 && !formData.duration) return alert("Seleziona una durata.");
    if (step === 4 && (!formData.name || !formData.email || !formData.phone)) return alert("Compila tutti i campi obbligatori.");
    const newStep = step + 1;
    setStep(newStep);
    setProgress(newStep * 25);
  };

  const prevStep = () => {
    const newStep = step - 1;
    setStep(newStep);
    setProgress(newStep * 25);
  };

  const fetchSlots = async () => {
    if (!formData.date) return;
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`http://localhost:5000/available-slots?date=${formData.date}`);
      const data = await res.json();
      setAvailableSlots(data.available_slots);
    } catch (err) {
      alert("Errore nel recupero degli slot disponibili.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (step === 2) fetchSlots();
  }, [step, formData.date]);

  const submitBooking = async () => {
    setStep(99); // spinner loading
    try {
      const res = await fetch("http://localhost:5000/book-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setStep(5);
      } else {
        alert(data.error);
        setStep(4);
      }
    } catch (err) {
      alert("Errore durante la prenotazione.");
      setStep(4);
    }
  };

  const resetForm = () => {
    setFormData({ date: '', time: '', duration: 60, name: '', email: '', phone: '', notes: '' });
    setStep(1);
    setProgress(25);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Book Your Private Lesson</h1>
        <p>Select your preferred date, time, and duration</p>
      </div>
      <div className="form-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="step active">
            <h2 className="step-title">📅 Select Date</h2>
            <div className="form-group">
              <label htmlFor="date">Choose your preferred date:</label>
              <input type="date" id="date" value={formData.date} onChange={handleInput} />
            </div>
            <div className="navigation">
              <div></div>
              <button className="btn btn-primary" onClick={nextStep}>Next</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="step active">
            <h2 className="step-title">⏰ Select Time</h2>
            {isLoadingSlots ? (
              <div className="loading"><div className="spinner"></div><p>Loading available time slots...</p></div>
            ) : (
              <div>
                <p>Available time slots:</p>
                <div className="time-slots">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot}
                      className={`time-slot ${formData.time === slot ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, time: slot })}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="navigation">
              <button className="btn btn-secondary" onClick={prevStep}>Previous</button>
              <button className="btn btn-primary" onClick={nextStep}>Next</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="step active">
            <h2 className="step-title">⏱️ Select Duration</h2>
            <div className="duration-options">
              {[30, 60, 90, 120].map((min) => (
                <div
                  key={min}
                  className={`duration-option ${formData.duration === min ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, duration: min })}
                >
                  <strong>{min === 30 ? '30 minutes' : `${min / 60} ${min === 60 ? 'hour' : 'hours'}`}</strong>
                  <div>{min === 30 ? 'Quick session' : min === 60 ? 'Standard lesson' : min === 90 ? 'Extended session' : 'Intensive lesson'}</div>
                </div>
              ))}
            </div>
            <div className="navigation">
              <button className="btn btn-secondary" onClick={prevStep}>Previous</button>
              <button className="btn btn-primary" onClick={nextStep}>Next</button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="step active">
            <h2 className="step-title">👤 Your Information</h2>
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-item"><span>Date:</span><strong>{formData.date}</strong></div>
              <div className="summary-item"><span>Time:</span><strong>{formData.time}</strong></div>
              <div className="summary-item"><span>Duration:</span><strong>{formData.duration} min</strong></div>
            </div>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input type="text" id="name" value={formData.name} onChange={handleInput} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input type="email" id="email" value={formData.email} onChange={handleInput} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input type="tel" id="phone" value={formData.phone} onChange={handleInput} required />
            </div>
            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea id="notes" rows={3} value={formData.notes} onChange={handleInput} />
            </div>
            <div className="navigation">
              <button className="btn btn-secondary" onClick={prevStep}>Previous</button>
              <button className="btn btn-primary" onClick={submitBooking}>Book Lesson</button>
            </div>
          </div>
        )}

        {/* Step 99: Loading */}
        {step === 99 && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Creating your booking...</p>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p>Your private lesson has been successfully booked. You will receive a confirmation email shortly.</p>
            <button className="btn btn-primary" onClick={resetForm}>Book Another Lesson</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

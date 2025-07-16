import React, { useState } from "react";
import { BookingForm } from "./BookingForm";
import Lottie from "lottie-react";
import loadingAnimation from "./loading-icon.json";



// Componente Button semplice dato che non hai shadcn/ui configurato
const Button = ({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    onClick={onClick}
    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
    {...props}
  >
    {children}
  </button>
);

const Index = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);


  async function fetchAvailableSlots(date: Date) {
      setIsLoadingSlots(true);
    try {
      const response = await fetch(
        `http://localhost:5000/available-slots?date=${date.toISOString().split("T")[0]}`
      );
      if (!response.ok) throw new Error("Errore nella richiesta");

      const data = await response.json();
      setAvailableTimes(data.available_slots);
    } catch (error) {
      console.error("Errore durante il recupero degli slot:", error);
    } finally {
    setIsLoadingSlots(false);
    }
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = new Date(e.target.value);
    setDate(newDate);
    setAvailableTimes([]);
    setShowForm(false);
    setSelectedTime("");
    fetchAvailableSlots(newDate);
  }

  function handleSlotClick(slot: string) {
    setSelectedTime(slot);
    setShowForm(true);
  }

  function handleFormSubmit() {
    // Dopo conferma prenotazione
    setShowForm(false);
    setSelectedTime("");
    setAvailableTimes([]);
    if (date) fetchAvailableSlots(date); // aggiorna gli slot disponibili
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Prenota una lezione</h1>

      <label className="block mb-2 font-medium">Scegli una data:</label>
      <input
        type="date"
        className="border p-2 rounded mb-4 w-full"
        onChange={handleDateChange}
      />

        {isLoadingSlots ? (
          <div className="flex flex-col items-center gap-2 my-6">
            <Lottie
              animationData={loadingAnimation}
              loop
              style={{ width: 100, height: 100 }}
            />
            <p className="text-black-600 text-sm">Caricamento orari disponibili...</p>
          </div>
        ) : (
          availableTimes.length > 0 && !showForm && (
            <>
              <h2 className="text-lg font-semibold mb-2">Orari disponibili:</h2>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {availableTimes.map((time) => (
                  <Button key={time} onClick={() => handleSlotClick(time)}>
                    {time}
                  </Button>
                ))}
              </div>
            </>
          )
        )}


      {showForm && date && selectedTime && (
        <BookingForm
          selectedDate={date}
          selectedTime={selectedTime}
          onSubmit={handleFormSubmit}
        />
      )}

    </div>
  );
};

export default Index;